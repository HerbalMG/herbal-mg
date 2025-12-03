// import React, { useEffect, useRef, useState } from "react";
// import { Link, useNavigate } from 'react-router-dom';
// import { generateProductUrl } from '../utils/productUtils';

// export function Banners({ banners }) {
//   const [bannerData, setBannerData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (banners && banners.length > 0) {
//       setBannerData(banners[0]);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     fetch('http://localhost:3001/api/banner')
//       .then(res => {
//         if (!res.ok) throw new Error('Failed to fetch banners');
//         return res.json();
//       })
//       .then(data => {
//         // Default: show the first ad banner
//         const ad = data.find(b => b.type === 'ad');
//         setBannerData(ad || null);
//         setLoading(false);
//       })
//       .catch(err => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [banners]);

//   if (loading) {
//     return <div className="h-[150px] flex items-center justify-center bg-gray-100">Loading banner...</div>;
//   }
//   if (error) {
//     return <div className="h-[150px] flex items-center justify-center text-red-500">{error}</div>;
//   }
//   if (!bannerData) {
//     return <div className="h-[150px] flex items-center justify-center text-gray-400">No banner available</div>;
//   }

//   const handleClick = () => {
//     if (bannerData.product_id) {
//       // Use product slug if available, otherwise fallback to ID
//       const productUrl = bannerData.product_slug ? `/product/${bannerData.product_slug}` : `/product/${bannerData.product_id}`;
//       navigate(productUrl);
//     } else if (bannerData.link) {
//       window.open(bannerData.link, '_blank', 'noopener');
//     }
//   };

//   return (
//     <div
//       className="relative w-full h-[20vh] md:h-[30vh] mt-2 rounded-2xl overflow-hidden cursor-pointer"
//       role="banner"
//       onClick={handleClick}
//     >
//       <img
//         src={bannerData.image_url}
//         alt={bannerData.title || 'Banner'}
//         className="w-full h-full object-cover"
//         style={{ minHeight: '100%', minWidth: '100%' }}
//       />
//     </div>
//   );
// }


// export default function BannerTop ({ banners }) {
//   const navigate = useNavigate();
//   const [currentPage, setCurrentPage] = useState(0);
//   const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

//   const touchStartX = useRef(null);
//   const touchEndX = useRef(null);
//   const mouseStartX = useRef(null);
//   const isDragging = useRef(false);

//   let bannersToShow;
//   if (banners === undefined) {
//     bannersToShow = images.map(src => ({ image_url: src }));
//   } else if (Array.isArray(banners) && banners.length > 0) {
//     bannersToShow = banners;
//   } else {
//     bannersToShow = [];
//   }

//   const totalPages = bannersToShow.length > 0 ? Math.ceil(bannersToShow.length / itemsPerPage) : 1;

//   function getItemsPerPage() {
//     return window.innerWidth < 640 ? 1 : 3;
//   }

//   const next = () => {
//     setCurrentPage((prev) => (prev + 1) % totalPages);
//   };

//   const prev = () => {
//     setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
//   };

//   // Responsive Resize
//   useEffect(() => {
//     const handleResize = () => {
//       const newCount = getItemsPerPage();
//       setItemsPerPage(newCount);
//       setCurrentPage(0);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // Autoplay
//   useEffect(() => {
//     const interval = setInterval(next, 3000);
//     return () => clearInterval(interval);
//   }, [currentPage, itemsPerPage]);

//   const handleTouchStart = (e) => {
//     touchStartX.current = e.touches[0].clientX;
//   };

//   const handleTouchMove = (e) => {
//     touchEndX.current = e.touches[0].clientX;
//   };

//   const handleTouchEnd = () => {
//     if (!touchStartX.current || !touchEndX.current) return;
//     const delta = touchStartX.current - touchEndX.current;

//     if (delta > 50) next();
//     else if (delta < -50) prev();

//     touchStartX.current = null;
//     touchEndX.current = null;
//   };

//   const handleMouseDown = (e) => {
//     mouseStartX.current = e.clientX;
//     isDragging.current = true;
//   };

//   const handleMouseUp = (e) => {
//     if (!isDragging.current) return;
//     const delta = mouseStartX.current - e.clientX;

//     if (delta > 50) next();
//     else if (delta < -50) prev();

//     isDragging.current = false;
//   };

//   const handleMouseLeave = () => {
//     isDragging.current = false;
//   };

//   const startIndex = currentPage * itemsPerPage;
//   const visibleBanners = bannersToShow.slice(startIndex, startIndex + itemsPerPage);

//   if (Array.isArray(banners) && banners.length === 0) {
//     return (
//       <div className="w-full max-w-6xl mx-auto py-6 text-center text-gray-400">
//         No top banners available.
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-7xl mx-auto py-6">
//       <div
//         className={`grid gap-4 ${
//           itemsPerPage === 1 ? 'grid-cols-1' : 'grid-cols-3'
//         } transition-transform duration-300 ease-in-out select-none`}
//         onTouchStart={handleTouchStart}
//         onTouchMove={handleTouchMove}
//         onTouchEnd={handleTouchEnd}
//         onMouseDown={handleMouseDown}
//         onMouseUp={handleMouseUp}
//         onMouseLeave={handleMouseLeave}
//       >
//         {visibleBanners.map((banner, idx) => {
//           const handleClick = () => {
//             if (banner.product_id) {
//               const productUrl = banner.product_slug ? `/product/${banner.product_slug}` : `/product/${banner.product_id}`;
//               navigate(productUrl);
//             } else if (banner.link) {
//               window.open(banner.link, '_blank', 'noopener');
//             }
//           };
//           return (
//             <img
//               key={banner.id || idx}
//               src={banner.image_url}
//               alt={banner.title || `Slide ${startIndex + idx + 1}`}
//               className="w-full h-44 sm:h-60 md:h-50 object-cover rounded shadow cursor-pointer"
//               draggable={false}
//               onClick={handleClick}
//             />
//           );
//         })}
//       </div>

//       {/* Pagination Dots */}
//       {Array.isArray(banners) && banners.length > 0 && totalPages > 1 && (
//   <div className="flex justify-center mt-4 space-x-2">
//     {Array.from({ length: totalPages }).map((_, idx) => (
//       <button
//         key={idx}
//         className={`w-3 h-3 rounded-full ${
//           idx === currentPage ? 'bg-blue-600' : 'bg-gray-300'
//         }`}
//         onClick={() => setCurrentPage(idx)}
//       />
//     ))}
//   </div>
// )}


//     </div>
//   );
// };


import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function Banners({ banners }) {
  const [bannerData, setBannerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (banners && banners.length > 0) {
      setBannerData(banners[0]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/banner`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch banners');
        return res.json();
      })
      .then(data => {
        // Default: show the first ad banner
        const ad = data.find(b => b.type === 'ad');
        setBannerData(ad || null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [banners]);

  if (loading) {
    return <div className="h-[150px] flex items-center justify-center bg-gray-100">Loading banner...</div>;
  }
  if (error) {
    return <div className="h-[150px] flex items-center justify-center text-red-500">{error}</div>;
  }
  if (!bannerData) {
    return <div className="h-[150px] flex items-center justify-center text-gray-400">No banner available</div>;
  }

  const handleClick = () => {
    if (bannerData.product_id) {
      // Use product slug if available, otherwise fallback to ID
      const productUrl = bannerData.product_slug ? `/product/${bannerData.product_slug}` : `/product/${bannerData.product_id}`;
      navigate(productUrl);
    } else if (bannerData.link) {
      window.open(bannerData.link, '_blank', 'noopener');
    }
  };

  return (
    <div
      className="relative w-full h-[20vh] md:h-[30vh] mt-2 rounded-2xl overflow-hidden cursor-pointer"
      role="banner"
      onClick={handleClick}
    >
      <img
        src={bannerData.image_url}
        alt={bannerData.title || 'Banner'}
        className="w-full h-full object-cover"
        style={{ minHeight: '100%', minWidth: '100%' }}
      />
    </div>
  );
}

export default function BannerTop({ banners }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const mouseStartX = useRef(null);
  const isDragging = useRef(false);

  // Determine banners to show
  const bannersToShow =
    Array.isArray(banners) && banners.length > 0 ? banners : [];

  const totalPages =
    bannersToShow.length > 0
      ? Math.ceil(bannersToShow.length / itemsPerPage)
      : 0;

  function getItemsPerPage() {
    return window.innerWidth < 640 ? 1 : 3;
  }

  const next = () => {
    if (totalPages === 0) return;
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prev = () => {
    if (totalPages === 0) return;
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // Responsive Resize
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(getItemsPerPage());
      setCurrentPage(0);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autoplay
  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(next, 3000);
    return () => clearInterval(interval);
  }, [currentPage, itemsPerPage, totalPages]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const delta = touchStartX.current - touchEndX.current;

    if (delta > 50) next();
    else if (delta < -50) prev();

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleMouseDown = (e) => {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseUp = (e) => {
    if (!isDragging.current) return;
    const delta = mouseStartX.current - e.clientX;

    if (delta > 50) next();
    else if (delta < -50) prev();

    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const startIndex = currentPage * itemsPerPage;
  const visibleBanners = bannersToShow.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // If no banners, return null on mobile to take no space
  if (bannersToShow.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto py-6">
      <div
        className={`grid gap-4 ${
          itemsPerPage === 1 ? "grid-cols-1" : "grid-cols-3"
        } transition-transform duration-300 ease-in-out select-none`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {visibleBanners.map((banner, idx) => {
          const handleClick = () => {
            if (banner.product_id) {
              const productUrl = banner.product_slug
                ? `/product/${banner.product_slug}`
                : `/product/${banner.product_id}`;
              navigate(productUrl);
            } else if (banner.link) {
              window.open(banner.link, "_blank", "noopener");
            }
          };
          return (
            <img
              key={banner.id || idx}
              src={banner.image_url}
              alt={banner.title || `Slide ${startIndex + idx + 1}`}
              className="w-full h-44 sm:h-60 md:h-50 object-cover rounded shadow cursor-pointer"
              draggable={false}
              onClick={handleClick}
            />
          );
        })}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={`w-3 h-3 rounded-full ${
                idx === currentPage ? "bg-blue-600" : "bg-gray-300"
              }`}
              onClick={() => setCurrentPage(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
