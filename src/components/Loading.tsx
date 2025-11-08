import React from "react";
import { Building2 } from "lucide-react";

const Loading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center items-center space-x-2 mb-8">
          <Building2 className="h-12 w-12 text-cyan-400" />
          <h1 className="text-4xl font-bold text-white">StartupHub</h1>
        </div>

        {/* Loading Animation */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent"></div>
          </div>

          <h2 className="text-2xl font-semibold text-white">
            Your Dashboard is in Process...
          </h2>
          <p className="text-gray-400 max-w-md">
            We're setting up your personalized workspace and preparing all your
            startup tools.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto">
          <div className="bg-gray-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full animate-pulse"
              style={{ width: "100%" }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">Almost ready...</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
