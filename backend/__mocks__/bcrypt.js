module.exports = {
  hash: jest.fn().mockResolvedValue('mocked-hash'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('mocked-salt'),
  hashSync: jest.fn().mockReturnValue('mocked-hash-sync'),
  compareSync: jest.fn().mockReturnValue(true),
  genSaltSync: jest.fn().mockReturnValue('mocked-salt-sync'),
};