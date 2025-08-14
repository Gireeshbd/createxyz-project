"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Target, Crosshair } from "lucide-react";

export default function LocationPicker({ onLocationSelect, initialLocation = "" }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      initializeMap();
    } else {
      // Load Google Maps script if not already loaded
      loadGoogleMapsScript();
    }
  }, []);

  const loadGoogleMapsScript = () => {
    // Check if Google Maps API key is available
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API key not found. Using fallback location picker.");
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error("Failed to load Google Maps API");
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Default to user's location or a central location
    const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York City

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: defaultLocation,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "on" }]
        },
        {
          featureType: "transit",
          elementType: "labels",
          stylers: [{ visibility: "simplified" }]
        }
      ]
    });

    const marker = new window.google.maps.Marker({
      position: defaultLocation,
      map: map,
      draggable: true,
      title: "Drag me to select job location",
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="8" fill="#2563eb" stroke="white" stroke-width="3"/>
            <circle cx="16" cy="16" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16),
      }
    });

    mapInstance.current = map;
    markerInstance.current = marker;
    setMapLoaded(true);

    // Handle map clicks
    map.addListener("click", (event) => {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      marker.setPosition(location);
      reverseGeocode(location);
    });

    // Handle marker drag
    marker.addListener("dragend", (event) => {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      reverseGeocode(location);
    });

    // Try to get user's current location automatically
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          map.setCenter(userLocation);
          marker.setPosition(userLocation);
          reverseGeocode(userLocation);
        },
        (error) => {
          console.log("Geolocation error:", error);
          // If geolocation fails, just use the default location
        }
      );
    }
  };

  const reverseGeocode = (location) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;

        setSelectedLocation({
          ...location,
          address,
        });

        console.log('Calling onLocationSelect with:', { address, coordinates: location });

        onLocationSelect({
          address,
          coordinates: location,
        });
      }
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (mapInstance.current && markerInstance.current) {
          mapInstance.current.setCenter(location);
          mapInstance.current.setZoom(16);
          markerInstance.current.setPosition(location);
        }

        reverseGeocode(location);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLoading(false);
        alert("Unable to get your current location. Please click on the map to select a location.");
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Target size={20} className="text-blue-600 mt-0.5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Select Job Location</h4>
            <p className="text-sm text-blue-700">
              Click anywhere on the map or drag the marker to set the exact job location.
              You can also use your current location as a starting point.
            </p>
          </div>
        </div>
      </div>

      {/* Map Container with Enhanced UI */}
      <div className="relative">
        <div className="border-2 border-[#E5E7EB] rounded-xl overflow-hidden shadow-lg bg-white">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <>
              <div
                ref={mapRef}
                className="w-full h-80 bg-gray-100 relative"
              />

              {/* Map Controls Overlay */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                  className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Use my current location"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                  )}
                </button>

                <div className="bg-white border border-gray-300 rounded-lg p-2 shadow-md">
                  <Crosshair size={20} className="text-gray-400" />
                </div>
              </div>

              {/* Loading Overlay */}
              {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center text-[#667085] max-w-sm">
                <div className="bg-white rounded-full p-4 mx-auto mb-4 shadow-md">
                  <MapPin size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Interactive Map</h3>
                <p className="text-sm mb-3">Google Maps API key required for full functionality</p>
                <p className="text-xs text-gray-500">Use the quick suggestions below to select a general area</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="bg-green-100 rounded-full p-2">
                <MapPin size={16} className="text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-900 mb-1">✓ Location Selected</div>
              <div className="text-sm text-green-700 leading-relaxed">{selectedLocation.address}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Suggestions - Only show if no Google Maps */}
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-[#101828] mb-3 flex items-center">
            <MapPin size={16} className="mr-2 text-blue-600" />
            Quick Location Options:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              "Downtown",
              "City Center",
              "North Side",
              "South Side",
              "East Side",
              "West Side",
              "Suburbs",
              "Near University"
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setSelectedLocation({ address: suggestion });
                  onLocationSelect({ address: suggestion, coordinates: null });
                }}
                className="px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 text-gray-700 hover:text-blue-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}