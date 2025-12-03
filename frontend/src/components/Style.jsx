import React from 'react'

import authentic from '/assets/authentic.svg';
import verified from '/assets/verified.svg';
import accessible from '/assets/money.svg';




const Style = () => {
  return (
    <>
      <div className="border-b my-4"></div>

      <div className="w-full">
        {/* Top Heading */}
        <div className="text-center py-4 sm:py-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold uppercase">
            India’s Largest Ayurvedic Healthcare Platform
          </h2>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-4 sm:gap-8 md:gap-12 text-center py-4">
          <div>
            <div className="text-xl font-bold text-blue-700 sm:text-2xl md:text-3xl">260m+</div>
            <div className="text-sm text-gray-600 sm:text-base">Visitors</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-700 sm:text-2xl md:text-3xl">31m+</div>
            <div className="text-sm text-gray-600 sm:text-base">Orders Delivered</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-700 sm:text-2xl md:text-3xl">1800+</div>
            <div className="text-sm text-gray-600 sm:text-base">Cities</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Style;



export function StyleHome() {
  return (
    <div className="w-full ">
      <div className="text-center py-2 sm:py-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
            Our Promise
          </h2>
        </div>
      {/* Stats Bar */}
      <div className="flex flex-row sm:flex-row justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 text-center py-4 sm:py-8">
        
        <div className="flex flex-col items-center max-w-xs mx-auto">
          <img src={authentic} alt="Authentic" className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mb-2" />
          <div className="text-base font-bold text-green-600 sm:text-xl md:text-2xl lg:text-3xl">Authentic</div>
          {/* <p className="mt-1 text-sm sm:text-base text-gray-600">
            We offer only original, company-sealed Ayurvedic products.
          </p> */}
        </div>

        <div className="flex flex-col items-center max-w-xs mx-auto">
          <img src={verified} alt="Verified" className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mb-2" />
          <div className="text-base font-bold text-green-600 sm:text-xl md:text-2xl lg:text-3xl">Verified</div>
          {/* <p className="mt-1 text-sm sm:text-base text-gray-600">
            Every product is sourced from trusted and certified brands.
          </p> */}
        </div>

        <div className="flex flex-col items-center max-w-xs mx-auto">
          <img src={accessible} alt="Accessible" className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mb-2" />
          <div className="text-base font-bold text-green-600 sm:text-xl md:text-2xl lg:text-3xl">Accessible</div>
          {/* <p className="mt-1 text-sm sm:text-base text-gray-600">
            Bringing quality herbal care to every doorstep with ease.
          </p> */}
        </div>

      </div>
      <div className="text-center py-4 sm:py-6">
          <p className="text-md sm:text-lg md:text-xl font-medium">
            HerbalMG brings together trusted Ayurvedic brands on one reliable platform.
Our service is rooted in authenticity, accessibility, and care.
          </p>
        </div>
    </div>
  );
}


