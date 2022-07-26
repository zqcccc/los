import { networkInterfaces } from 'os';

const nets = networkInterfaces();

const addresses = [];
for (const k in nets) {
  for (const k2 in nets[k]) {
    const address = nets[k][k2];
    if (address.family === 'IPv4' && !address.internal) {
      addresses.push(address.address);
    }
  }
}

export { addresses };
