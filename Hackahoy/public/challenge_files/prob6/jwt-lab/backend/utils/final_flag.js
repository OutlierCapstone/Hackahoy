// backend/utils/final_flag.js
function getFlag() {
  return process.env.FLAG || "flag{default_dummy_flag}";
}
module.exports = { getFlag };
