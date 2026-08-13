import { isInternalCollectorAddress } from './collect.controller';

describe('isInternalCollectorAddress', () => {
  it.each(['127.0.0.1', '::1', '::ffff:172.17.0.2', '10.0.0.4']) (
    'allows internal address %s',
    (address) => expect(isInternalCollectorAddress(address)).toBe(true),
  );

  it.each(['44.199.70.243', '203.0.113.10', undefined])(
    'rejects external address %s',
    (address) => expect(isInternalCollectorAddress(address)).toBe(false),
  );
});
