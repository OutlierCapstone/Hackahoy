/** @type {import('next').NextConfig} */
const nextConfig = {
  // 브라우저는 프록시 포트(5003)로만 접속한다. 백엔드(4003)를 직접 부르면
  // 요청이 nginx 를 거치지 않아 공격 로그가 한 건도 수집되지 않는다.
  // 그래서 프론트가 같은 오리진의 /api/* 를 받아 백엔드로 넘긴다.
  // prob1(next.config.mjs -> 4001)과 같은 구조다.
  //
  // 주의: prob1 은 destination 에서 /api 를 벗기지만(백엔드가 /chat 을 제공),
  // prob3 의 FastAPI 는 /api/chat 을 그대로 제공하므로 여기서는 /api 를 보존한다.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4003/api/:path*',
      },
    ];
  },
};

export default nextConfig;
