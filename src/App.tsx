import { useState, useEffect } from 'react';
import { Search, MapPin, Thermometer, Droplets, Wind, Sun, Cloud, CloudRain, Snowflake, CloudLightning, Calendar, Clock, Star, Plus, X, Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './App.css';

const weatherIcons: Record<number, any> = {
  0: Sun,
  1: Sun,
  2: Cloud,
  3: Cloud,
  45: Cloud,
  48: Cloud,
  51: CloudRain,
  53: CloudRain,
  55: CloudRain,
  61: CloudRain,
  63: CloudRain,
  65: CloudRain,
  71: Snowflake,
  73: Snowflake,
  75: Snowflake,
  80: CloudRain,
  81: CloudRain,
  82: CloudRain,
  95: CloudLightning,
  96: CloudLightning,
  99: CloudLightning,
};

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight showers',
  81: 'Moderate showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

// Popular cities from around the world
const popularCities = [
  { name: 'New York', country: 'United States' },
  { name: 'London', country: 'United Kingdom' },
  { name: 'Tokyo', country: 'Japan' },
  { name: 'Paris', country: 'France' },
  { name: 'Sydney', country: 'Australia' },
  { name: 'Dubai', country: 'United Arab Emirates' },
  { name: 'Singapore', country: 'Singapore' },
  { name: 'Mumbai', country: 'India' },
  { name: 'São Paulo', country: 'Brazil' },
  { name: 'Cairo', country: 'Egypt' },
  { name: 'Moscow', country: 'Russia' },
  { name: 'Toronto', country: 'Canada' },
];

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    rain: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
}

interface Location {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

interface FavoriteCity {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

interface CompareData {
  name: string;
  country: string;
  temp: number | null;
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'hourly' | 'daily' | 'compare'>('current');
  const [compareData, setCompareData] = useState<CompareData[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('weatherFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    // Load default city
    fetchWeather('London');
  }, []);

  // Fetch data for the Compare tab
  useEffect(() => {
    if (activeTab === 'compare' && compareData.length === 0) {
      const fetchCompareData = async () => {
        setLoadingCompare(true);
        try {
          const results = await Promise.all(
            popularCities.map(async (city) => {
              try {
                const geoResponse = await fetch(
                  `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.name)}&count=1&language=en&format=json`
                );
                const geoData = await geoResponse.json();
                
                if (geoData.results && geoData.results.length > 0) {
                  const location = geoData.results[0];
                  const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m`
                  );
                  const weather = await weatherResponse.json();
                  if (weather.current) {
                    return { name: city.name, country: city.country, temp: weather.current.temperature_2m };
                  }
                }
                return { ...city, temp: null };
              } catch (e) {
                return { ...city, temp: null };
              }
            })
          );
          setCompareData(results);
        } catch (err) {
          console.error('Failed to fetch compare data', err);
        } finally {
          setLoadingCompare(false);
        }
      };
      fetchCompareData();
    }
  }, [activeTab, compareData.length]);

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setLocations([]);
      return;
    }
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      const data = await response.json();
      if (data.results) {
        setLocations(data.results);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError('');
    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );
      const geoData = await geoResponse.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        setError('City not found');
        setLoading(false);
        return;
      }

      const location = geoData.results[0];
      setSelectedLocation(location);
      setLocations([]);
      setSearchQuery('');

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`
      );
      const weather = await weatherResponse.json();
      setWeatherData(weather);
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = () => {
    if (!selectedLocation) return;
    const exists = favorites.some(
      (f) => f.name === selectedLocation.name && f.country === selectedLocation.country
    );
    if (!exists) {
      const newFavorites = [...favorites, { ...selectedLocation }];
      setFavorites(newFavorites);
      localStorage.setItem('weatherFavorites', JSON.stringify(newFavorites));
    }
  };

  const removeFromFavorites = (index: number) => {
    const newFavorites = favorites.filter((_, i) => i !== index);
    setFavorites(newFavorites);
    localStorage.setItem('weatherFavorites', JSON.stringify(newFavorites));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeather(searchQuery);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  };

  const getCurrentHourIndex = () => {
    if (!weatherData) return 0;
    const now = new Date();
    const currentHour = now.getHours();
    return weatherData.hourly.time.findIndex((t) => {
      const time = new Date(t);
      return time.getHours() === currentHour;
    });
  };

  const WeatherIcon = ({ code, size = 24 }: { code: number; size?: number }) => {
    const Icon = weatherIcons[code] || Sun;
    return <Icon size={size} />;
  };

  // Prepare chart data
  const hourlyChartData = weatherData ? weatherData.hourly.time.slice(getCurrentHourIndex(), getCurrentHourIndex() + 24).map((time, i) => ({
    time: formatTime(time),
    temp: Math.round(weatherData.hourly.temperature_2m[getCurrentHourIndex() + i]),
  })) : [];

  const dailyChartData = weatherData ? weatherData.daily.time.map((date, i) => ({
    day: formatDate(date),
    high: Math.round(weatherData.daily.temperature_2m_max[i]),
    low: Math.round(weatherData.daily.temperature_2m_min[i]),
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center justify-center gap-3">
            <Cloud className="text-blue-300" size={48} />
            Weather Forecast
          </h1>
          <p className="text-blue-200">Real-time weather updates for any city worldwide</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 relative"
        >
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchLocations(e.target.value);
              }}
              placeholder="Search for any city worldwide..."
              className="w-full px-6 py-4 pl-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60" size={20} />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-full font-medium transition-colors"
            >
              Search
            </button>
          </form>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {locations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-1/2 -translate-x-1/2 w-full max-w-xl mt-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden z-50"
              >
                {locations.map((location) => (
                  <button
                    key={`${location.name}-${location.country}`}
                    onClick={() => fetchWeather(location.name)}
                    className="w-full px-6 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <MapPin size={18} />
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-white/60">{location.country}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Popular Cities */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Globe className="text-blue-300" size={20} />
            <span className="text-sm text-white/60">Popular Cities</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {popularCities.map((city) => (
              <button
                key={city.name}
                onClick={() => fetchWeather(city.name)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
              >
                {city.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Favorites Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
          >
            <Star size={18} className={showFavorites ? 'fill-yellow-400 text-yellow-400' : ''} />
            Favorites ({favorites.length})
          </button>
        </motion.div>

        {/* Favorites Panel */}
        <AnimatePresence>
          {showFavorites && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4"
            >
              <div className="flex flex-wrap gap-3">
                {favorites.map((fav, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2"
                  >
                    <button
                      onClick={() => fetchWeather(fav.name)}
                      className="hover:text-blue-300 transition-colors"
                    >
                      {fav.name}
                    </button>
                    <button
                      onClick={() => removeFromFavorites(index)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {favorites.length === 0 && (
                  <p className="text-white/60">No favorite cities yet. Add one!</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
            <p className="mt-4 text-white/60">Loading weather data...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-red-300 text-xl">{error}</p>
          </motion.div>
        )}

        {/* Weather Display */}
        <AnimatePresence>
          {weatherData && selectedLocation && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Location Header */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
                  <MapPin size={28} />
                  {selectedLocation.name}, {selectedLocation.country}
                </h2>
                <button
                  onClick={addToFavorites}
                  className="mt-2 flex items-center gap-2 mx-auto bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
                >
                  <Plus size={18} />
                  Add to Favorites
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {(['current', 'hourly', 'daily', 'compare'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Current Weather Tab */}
              {activeTab === 'current' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid md:grid-cols-2 gap-6"
                >
                  {/* Main Weather Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-white/60 mb-1">Current Weather</p>
                        <p className="text-2xl font-medium">
                          {weatherDescriptions[weatherData.current.weather_code] || 'Unknown'}
                        </p>
                      </div>
                      <WeatherIcon
                        code={weatherData.current.weather_code}
                        size={80}
                      />
                    </div>
                    <div className="flex items-end gap-4">
                      <span className="text-8xl font-light">
                        {Math.round(weatherData.current.temperature_2m)}°
                      </span>
                      <div className="pb-4">
                        <p className="text-white/60">Feels like</p>
                        <p className="text-2xl">
                          {Math.round(weatherData.current.apparent_temperature)}°
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Weather Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <Thermometer className="text-red-400 mb-2" size={32} />
                      <p className="text-white/60 text-sm">Temperature</p>
                      <p className="text-2xl font-bold">
                        {Math.round(weatherData.current.temperature_2m)}°C
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <Droplets className="text-blue-400 mb-2" size={32} />
                      <p className="text-white/60 text-sm">Humidity</p>
                      <p className="text-2xl font-bold">
                        {weatherData.current.relative_humidity_2m}%
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <Wind className="text-gray-300 mb-2" size={32} />
                      <p className="text-white/60 text-sm">Wind Speed</p>
                      <p className="text-2xl font-bold">
                        {Math.round(weatherData.current.wind_speed_10m)} km/h
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <CloudRain className="text-cyan-400 mb-2" size={32} />
                      <p className="text-white/60 text-sm">Precipitation</p>
                      <p className="text-2xl font-bold">
                        {weatherData.current.precipitation} mm
                      </p>
                    </div>
                  </div>

                  {/* Sun Times */}
                  <div className="md:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Sun className="text-yellow-400" />
                      Sun Schedule
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Sun className="text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-white/60">Sunrise</p>
                          <p className="text-xl font-semibold">
                            {formatTime(weatherData.daily.sunrise[0])}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Sun className="text-orange-400" />
                        </div>
                        <div>
                          <p className="text-white/60">Sunset</p>
                          <p className="text-xl font-semibold">
                            {formatTime(weatherData.daily.sunset[0])}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UV Index */}
                  <div className="md:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">UV Index</h3>
                        <p className="text-white/60">
                          {weatherData.daily.uv_index_max[0] <= 2
                            ? 'Low'
                            : weatherData.daily.uv_index_max[0] <= 5
                            ? 'Moderate'
                            : weatherData.daily.uv_index_max[0] <= 7
                            ? 'High'
                            : weatherData.daily.uv_index_max[0] <= 10
                            ? 'Very High'
                            : 'Extreme'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold">
                          {weatherData.daily.uv_index_max[0].toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-500"
                        style={{
                          width: `${Math.min(weatherData.daily.uv_index_max[0] * 10, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Hourly Forecast Tab */}
              {activeTab === 'hourly' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Temperature Chart */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="text-blue-300" />
                      24-Hour Temperature Trend
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyChartData}>
                          <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="time" 
                            stroke="rgba(255,255,255,0.6)"
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.6)"
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.8)', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px'
                            }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="temp" 
                            stroke="#60A5FA" 
                            fillOpacity={1} 
                            fill="url(#colorTemp)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Hourly Cards */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Clock className="text-blue-300" />
                      Hourly Breakdown
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                      {weatherData.hourly.time.slice(getCurrentHourIndex(), getCurrentHourIndex() + 24).map((time, i) => (
                        <div
                          key={i}
                          className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <p className="text-sm text-white/60 mb-2">
                            {formatTime(time)}
                          </p>
                          <WeatherIcon
                            code={weatherData.hourly.weather_code[getCurrentHourIndex() + i]}
                            size={32}
                          />
                          <p className="text-lg font-semibold mt-2">
                            {Math.round(weatherData.hourly.temperature_2m[getCurrentHourIndex() + i])}°
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Daily Forecast Tab */}
              {activeTab === 'daily' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Temperature Chart */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="text-blue-300" />
                      7-Day Temperature Range
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="day" 
                            stroke="rgba(255,255,255,0.6)"
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.6)"
                            tick={{ fill: 'rgba(255,255,255,0.6)' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.8)', 
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px'
                            }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="high" fill="#F97316" name="High" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="low" fill="#3B82F6" name="Low" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Daily Cards */}
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="text-blue-300" />
                      7-Day Forecast
                    </h3>
                    <div className="space-y-3">
                      {weatherData.daily.time.map((date, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <WeatherIcon code={weatherData.daily.weather_code[i]} size={40} />
                            <div>
                              <p className="font-medium">{formatDate(date)}</p>
                              <p className="text-sm text-white/60">
                                {weatherDescriptions[weatherData.daily.weather_code[i]] || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-blue-400">
                              <TrendingDown size={16} />
                              <span className="text-white/60">
                                {Math.round(weatherData.daily.temperature_2m_min[i])}°
                              </span>
                            </div>
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-orange-400"
                                style={{
                                  width: `${
                                    ((weatherData.daily.temperature_2m_max[i] -
                                      weatherData.daily.temperature_2m_min[i]) /
                                      30) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <div className="flex items-center gap-1 text-orange-400">
                              <span className="font-semibold">
                                {Math.round(weatherData.daily.temperature_2m_max[i])}°
                              </span>
                              <TrendingUp size={16} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Compare Tab */}
              {activeTab === 'compare' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Globe className="text-blue-300" />
                      Compare Popular Cities
                    </h3>
                    <p className="text-white/60 mb-4">Current temperatures in major world cities</p>
                    {loadingCompare ? (
                      <div className="col-span-full flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {compareData.map((city) => (
                          <div
                            key={city.name}
                            onClick={() => {
                              setActiveTab('current');
                              fetchWeather(city.name);
                            }}
                            className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <p className="font-medium">{city.name}</p>
                            <p className="text-sm text-white/60">{city.country}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Thermometer size={18} className="text-red-400" />
                              <span className="text-2xl font-bold">
                                {city.temp !== null ? Math.round(city.temp) : '--'}°
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="text-blue-300" />
                      Temperature Comparison Chart
                    </h3>
                    <p className="text-white/60 mb-4">Current temperature differences across major cities</p>
                    {loadingCompare ? (
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-white/40">Loading chart data...</p>
                      </div>
                    ) : (
                      <div className="h-64 mt-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis 
                              dataKey="name" 
                              stroke="rgba(255,255,255,0.6)"
                              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                            />
                            <YAxis 
                              stroke="rgba(255,255,255,0.6)"
                              tick={{ fill: 'rgba(255,255,255,0.6)' }}
                            />
                            <Tooltip 
                              cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px'
                              }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="temp" fill="#3B82F6" name="Temperature (°C)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-white/40 text-sm"
        >
          <p>Powered by Open-Meteo API • Real-time weather data for cities worldwide</p>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;