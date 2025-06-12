import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://wvknjjquuztcoszluuxu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2a25qanF1dXp0Y29zemx1dXh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzA5NTQ4OCwiZXhwIjoyMDYyNjcxNDg4fQ.Cs9EBV1bpJ0mDCuziRWS3op5EH8QJRAxYpee8dVmfeI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSchema() {
  try {
    console.log('Checking Supabase schema...\n');

    // Check users table
    console.log('=== USERS TABLE ===');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('Users table error:', usersError);
    } else if (usersData && usersData.length > 0) {
      console.log('Users columns:', Object.keys(usersData[0]));
      console.log('Sample data:', usersData[0]);
    } else {
      console.log('Users table exists but is empty');
    }

    // Check categories table
    console.log('\n=== CATEGORIES TABLE ===');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (categoriesError) {
      console.log('Categories table error:', categoriesError);
    } else if (categoriesData && categoriesData.length > 0) {
      console.log('Categories columns:', Object.keys(categoriesData[0]));
      console.log('Sample data:', categoriesData[0]);
    } else {
      console.log('Categories table exists but is empty');
    }

    // Check products table
    console.log('\n=== PRODUCTS TABLE ===');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.log('Products table error:', productsError);
    } else if (productsData && productsData.length > 0) {
      console.log('Products columns:', Object.keys(productsData[0]));
      console.log('Sample data:', productsData[0]);
    } else {
      console.log('Products table exists but is empty');
    }

    // Check orders table
    console.log('\n=== ORDERS TABLE ===');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.log('Orders table error:', ordersError);
    } else if (ordersData && ordersData.length > 0) {
      console.log('Orders columns:', Object.keys(ordersData[0]));
      console.log('Sample data:', ordersData[0]);
    } else {
      console.log('Orders table exists but is empty');
    }

    // Check addresses table
    console.log('\n=== ADDRESSES TABLE ===');
    const { data: addressesData, error: addressesError } = await supabase
      .from('addresses')
      .select('*')
      .limit(1);
    
    if (addressesError) {
      console.log('Addresses table error:', addressesError);
    } else if (addressesData && addressesData.length > 0) {
      console.log('Addresses columns:', Object.keys(addressesData[0]));
      console.log('Sample data:', addressesData[0]);
    } else {
      console.log('Addresses table exists but is empty');
    }

    // Check payments table
    console.log('\n=== PAYMENTS TABLE ===');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (paymentsError) {
      console.log('Payments table error:', paymentsError);
    } else if (paymentsData && paymentsData.length > 0) {
      console.log('Payments columns:', Object.keys(paymentsData[0]));
      console.log('Sample data:', paymentsData[0]);
    } else {
      console.log('Payments table exists but is empty');
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
