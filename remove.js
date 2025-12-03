// const fs = require('fs');

// // Read the JSON file
// const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

// // Use a Set to track seen pincodes
// const seen = new Set();
// const uniqueEntries = [];

// for (const entry of data) {
//     if (!seen.has(entry.Pincode)) {
//         seen.add(entry.Pincode);
        
//         // Create a new object without 'PostOfficeName'
//         const { PostOfficeName, ...rest } = entry;
//         uniqueEntries.push(rest);
//     }
// }

// // Write the result to a new JSON file
// fs.writeFileSync('unique_pincodes.json', JSON.stringify(uniqueEntries, null, 2), 'utf-8');

// console.log('Duplicates removed and PostOfficeName stripped.');







<div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
      <img
        src="https://via.placeholder.com/300x200?text=Coming+Soon"
        alt="Coming Soon Illustration"
        className="mb-6 w-64 h-auto"
      />
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-700 mb-4">
        Coming Soon
      </h1>
      <p className="text-gray-600 text-lg max-w-xl">
        We're working hard to bring these medicine as soon as possible. Stay tuned for updates!
      </p>
    </div>