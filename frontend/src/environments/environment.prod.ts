export const environment = {
  production: true,
  apiUrl: '/api'
};

// In Docker, nginx proxies /api/ -> backend:8080
// No need to change anything for Docker deployment
