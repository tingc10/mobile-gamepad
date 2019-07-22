import io from 'socket.io-client';

const isProd = process.env.NODE_ENV === 'production';
const host = isProd ? 'https://young-gorge-52676.herokuapp.com' : 'http://localhost';
export const socket = io(`${host}:52300`, {
  query: {
    type: 'controller'
  }
});
