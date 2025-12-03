import { useNavigate } from "react-router-dom";
import { RiShoppingBag4Fill } from "react-icons/ri";

export default function LoginPrompt() {
  const navigate = useNavigate();

  return (
    <div className=" flex  justify-center px-4">
      <div className="max-w-md w-full  p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <RiShoppingBag4Fill className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Login Required
        </h2>
        
        <p className="text-gray-600 mb-8">
          Please login to view your order history and track your orders
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/login")}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Login
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
