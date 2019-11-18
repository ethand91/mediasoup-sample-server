module.exports = async ({ userId, roomId, rtcStatsReport }) => {
  const action = 'rtcStats';

  try {
    // Uncomment below to log remote stats
    // console.log(rtcStatsReport);
  } catch (error) {
    console.error('failed to handle rtcStats', error);
    return { action, error: error.message };
  }
};
