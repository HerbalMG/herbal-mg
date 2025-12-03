// import { Link } from "react-router-dom";
// import {
//   FaFacebookF,
//   FaInstagram,
//   FaYoutube,
//   FaXTwitter,
// } from "react-icons/fa6";

// const Footer = () => {
//   return (
//     <footer className="bg-white text-black pt-6 pb-6 mt-6 border-t-2 border-green-700 ">
//       <div className="container mx-auto px-4 space-y-6">

//         {/* Row 1: Logo and Description side by side */}
//         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
//           {/* <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">HerbalMG</h2> */}
// <Link
//       to="/"
//       className="relative z-20 mr-2 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
//     >
//       {/* <img
//         src="H.png"
//         alt="logo"
//         width={30}
//         height={30}
//       /> */}
//     <img src="logo-2.png" alt="" width={110} height={110} />
//     </Link>
           
//           {/* <img src="start-logo.png" alt="" width={80} height={80}/> */}
//           {/* <p className="text-sm sm:text-base text-gray-900 max-w-3xl">
//             HerbalMG brings together trusted Ayurvedic brands on one reliable platform.
// Our service is rooted in authenticity, accessibility, and care.
//           </p> */}

//           <div className="flex flex-wrap justify-between items-center gap-4  pt-4">
//           {/* Navigation Links */}
//           <div className="flex flex-wrap gap-4 text-sm sm:text-base font-medium">
//             <Link to="/about-us" className="hover:text-orange-600 hover:underline">About</Link>
//             <Link to="/terms-and-conditions" className="hover:text-orange-600 hover:underline">Terms & Conditions</Link>
//             <Link to="/privacy-policy" className="hover:text-orange-600 hover:underline">Privacy Policy</Link>
//             <Link to="/return-and-refund-policy" className="hover:text-orange-600 hover:underline">Return & Refund Policy</Link>
//             <Link to="/faq" className="hover:text-orange-600 hover:underline">FAQs</Link>
//           </div>

//           {/* Social Media Icons */}
//           <div className="flex space-x-4 text-xl sm:text-2xl mt-2 sm:mt-0">
//             <a href="#" target="_blank" aria-label="Facebook">
//               <FaFacebookF className="text-[#1877F2] hover:text-black transition" />
//             </a>
//             <a href="https://www.instagram.com/herbal.mg?igsh=OHd6a29zZGswbzZ3" target="_blank" aria-label="Instagram">
//               <FaInstagram className="text-[#E4405F] hover:text-black transition" />
//             </a>
//             {/* <a href="#" target="_blank" aria-label="YouTube">
//               <FaYoutube className="text-[#FF0000] hover:text-black transition" />
//             </a> */}
//             <a href="#" target="_blank" aria-label="X (Twitter)">
//               <FaXTwitter className="text-black hover:text-[#1DA1F2] transition" />
//             </a>
//           </div>
//         </div>
        
//         </div>

//         {/* Row 3: Bottom Note */}
//         {/* <div className="text-center text-gray-700 text-xs font-bold leading-relaxed pt-4 ">
//           &copy; {new Date().getFullYear()} HerbalMG. All rights reserved. 
//           Dispensed in accordance with the Drugs and Cosmetics Act, 1940 & Rules, 1945.
//           Crafted by{" "}
//           <a
//             href="https://portfolio-shreyam91s-projects.vercel.app/"
//             className="text-green-500 hover:underline"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             @Developer
//           </a>
//         </div> */}
//       </div>
//     </footer>
//   );
// };

// export default Footer;



import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
} from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="bg-white text-black pt-6 pb-20 sm:pb-6 mt-6 border-t-2 border-green-700">
      <div className="container mx-auto px-4">
        
        {/* Main Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">

          {/* Left - Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <img src="logo-2.png" alt="logo" width={110} height={110} />
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-4 text-sm sm:text-base font-medium text-center">
            <Link to="/about-us" className="hover:text-orange-600 hover:underline">About</Link>
            <Link to="/terms-and-conditions" className="hover:text-orange-600 hover:underline">Terms & Conditions</Link>
            <Link to="/privacy-policy" className="hover:text-orange-600 hover:underline">Privacy Policy</Link>
            <Link to="/return-and-refund-policy" className="hover:text-orange-600 hover:underline">Return & Refund Policy</Link>
            <Link to="/faq" className="hover:text-orange-600 hover:underline">FAQs</Link>
          </nav>

          {/* Right - Social Icons */}
          <div className="flex space-x-4 text-xl sm:text-2xl">
            <a href="#" target="_blank" aria-label="Facebook">
              <FaFacebookF className="text-[#1877F2] hover:text-black transition" />
            </a>
            <a
              href="https://www.instagram.com/herbal.mg?igsh=OHd6a29zZGswbzZ3"
              target="_blank"
              aria-label="Instagram"
            >
              <FaInstagram className="text-[#E4405F] hover:text-black transition" />
            </a>
            <a href="#" target="_blank" aria-label="X (Twitter)">
              <FaXTwitter className="text-black hover:text-[#1DA1F2] transition" />
            </a>
          </div>

        </div>

      </div>

       <div className="text-center text-gray-700 text-xs font-bold leading-relaxed pt-4 ">
           &copy; {new Date().getFullYear()} HerbalMG. All rights reserved. 
           Dispensed in accordance with the Drugs and Cosmetics Act, 1940 & Rules, 1945.
           Crafted by{" "}
           <a
             href="https://portfolio-shreyam91s-projects.vercel.app/"
             className="text-green-500 hover:underline"
             target="_blank"
             rel="noopener noreferrer"
           >
             @Developer
           </a>
         </div> 
    </footer>
  );
};

export default Footer;
