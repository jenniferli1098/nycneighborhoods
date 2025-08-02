const formatUserResponse = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    description: user.description || '',
    location: user.location || '',
    mapPreferences: user.mapPreferences || { visibleMaps: ['nyc', 'boston', 'countries'] }
  };
};

const createAuthResponse = (user, token) => {
  return {
    token,
    user: formatUserResponse(user)
  };
};

module.exports = {
  formatUserResponse,
  createAuthResponse
};