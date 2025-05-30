// Simple script to test API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testCategoryEndpoints() {
  console.log('Testing category endpoints...');
  
  try {
    // Get all categories
    const categoriesResponse = await fetch(`${BASE_URL}/api/categories`);
    const categories = await categoriesResponse.json();
    console.log(`Found ${categories.length} categories`);
    
    // Get a specific category
    if (categories.length > 0) {
      const category_id = categories[0].id;
      const categoryResponse = await fetch(`${BASE_URL}/api/categories/${category_id}`);
      const category = await categoryResponse.json();
      console.log('Category details:', category);
    }
    
    console.log('Category endpoints working correctly');
  } catch (error) {
    console.error('Error testing category endpoints:', error);
  }
}

async function testProductEndpoints() {
  console.log('Testing product endpoints...');
  
  try {
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    const products = await productsResponse.json();
    console.log(`Found ${products.length} products`);
    
    if (products.length > 0) {
      const productId = products[0].id;
      const productResponse = await fetch(`${BASE_URL}/api/products/${productId}`);
      const product = await productResponse.json();
      console.log('Product details:', product);
    }
    
    console.log('Product endpoints working correctly');
  } catch (error) {
    console.error('Error testing product endpoints:', error);
  }
}

async function testCustomerEndpoints() {
  console.log('Testing customer endpoints...');
  
  try {
    // Get all customers
    const customersResponse = await fetch(`${BASE_URL}/api/customers`);
    const customers = await customersResponse.json();
    console.log(`Found ${customers.length} customers`);
    
    // Get a specific customer
    if (customers.length > 0) {
      const customerId = customers[0].id;
      const customerResponse = await fetch(`${BASE_URL}/api/customers/${customerId}`);
      const customer = await customerResponse.json();
      console.log('Customer details:', customer);
    }
    
    console.log('Customer endpoints working correctly');
  } catch (error) {
    console.error('Error testing customer endpoints:', error);
  }
}

async function runTests() {
  await testCategoryEndpoints();
  console.log('-------------------');
  await testProductEndpoints();
  console.log('-------------------');
  await testCustomerEndpoints();
}

runTests().catch(console.error);
