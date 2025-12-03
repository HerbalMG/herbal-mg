#!/usr/bin/env node

/**
 * Test script to verify category API is working
 * Usage: node scripts/test-category-api.js
 */

require('dotenv').config();
const sql = require('../config/supabase');

async function testCategoryAPI() {
  console.log('🧪 Testing Category API...\n');

  try {
    // Test 1: Check if table exists and has data
    console.log('1️⃣ Checking main_category table...');
    const categories = await sql`SELECT * FROM main_category ORDER BY id`;
    
    if (categories.length === 0) {
      console.log('⚠️  No categories found in database');
      console.log('💡 Run: node scripts/run-migration.js migrations/seed_main_categories.sql');
    } else {
      console.log(`✅ Found ${categories.length} categories`);
      console.log('\n📋 Categories:');
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (slug: ${cat.slug}, image: ${cat.image_url || 'none'})`);
      });
    }

    // Test 2: Check if image_url column exists
    console.log('\n2️⃣ Checking image_url column...');
    const hasImageUrl = categories.length > 0 && 'image_url' in categories[0];
    if (hasImageUrl) {
      console.log('✅ image_url column exists');
      const withImages = categories.filter(c => c.image_url).length;
      console.log(`   ${withImages}/${categories.length} categories have images`);
    } else {
      console.log('⚠️  image_url column missing');
      console.log('💡 Run: node scripts/run-migration.js migrations/add_image_url_to_main_category.sql');
    }

    // Test 3: Check slug generation
    console.log('\n3️⃣ Checking slug generation...');
    const withSlugs = categories.filter(c => c.slug).length;
    if (withSlugs === categories.length) {
      console.log(`✅ All ${categories.length} categories have slugs`);
    } else {
      console.log(`⚠️  ${categories.length - withSlugs} categories missing slugs`);
    }

    console.log('\n✅ Category API test completed!\n');
    
    if (categories.length === 0) {
      console.log('📝 Next steps:');
      console.log('   1. Run seed migration: node scripts/run-migration.js migrations/seed_main_categories.sql');
      console.log('   2. Start backend: npm start');
      console.log('   3. Test frontend: visit http://localhost:5173\n');
    } else {
      console.log('🎉 Everything looks good! Your categories are ready to use.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testCategoryAPI();
