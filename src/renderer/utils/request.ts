import axios from 'axios'

const baseUrl = 'http://101.132.105.74:3000/api/'
//const baseUrl = 'http://localhost:3000/api/'
const apiClient = axios.create({
  baseURL: baseUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default apiClient