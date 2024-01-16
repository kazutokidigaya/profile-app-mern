function getISTDate() {
  const currentUtcTime = new Date();
  const istOffset = 5.5; // IST is UTC +5:30
  return new Date(currentUtcTime.getTime() + istOffset * 3600 * 1000);
}

module.exports = {
  getISTDate,
};
