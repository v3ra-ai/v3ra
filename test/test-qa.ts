import axios, { AxiosError } from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testHealthCheck() {
  console.log('Testing /api/admin/health-check...');
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/health-check`);
    console.log('Health Check:', res.status, res.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Health Check Error:', axiosError.response?.status, axiosError.message);
  }
}

async function testVoteHistory(limit?: number) {
  console.log(`Testing /api/vote-history${limit ? `?limit=${limit}` : ''}...`);
  try {
    const res = await axios.get(`${BASE_URL}/api/vote-history${limit ? `?limit=${limit}` : ''}`);
    console.log('Vote History:', res.status, res.data.length, 'sessions');
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Vote History Error:', axiosError.response?.status, axiosError.message);
  }
}

async function testBroadcast(queryText: string) {
  console.log(`Testing /api/broadcast with query: "${queryText}"...`);
  try {
    const res = await axios.post(`${BASE_URL}/api/broadcast`, { queryText }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Broadcast:', res.status, res.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Broadcast Error:', axiosError.response?.status, axiosError.response?.data || axiosError.message);
  }
}

async function testNetwork() {
  console.log('Testing /api/network...');
  try {
    const res = await axios.get(`${BASE_URL}/api/network`);
    console.log('Network:', res.status, res.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Network Error:', axiosError.response?.status, axiosError.message);
  }
}

async function runTests() {
  await testHealthCheck();
  await testVoteHistory(10);
  await testVoteHistory(5);
  await testVoteHistory(); // Default
  await testBroadcast('Is the sky blue?');
  await testBroadcast(''); // Empty query
  await testBroadcast(undefined as any); // Missing queryText
  await testNetwork();
}

runTests().catch(console.error);