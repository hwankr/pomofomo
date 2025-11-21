import TimerApp from "../components/TimerApp";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
        Pomofomo
      </h1>
      <p className="text-gray-400 mb-10 text-lg">
        뽀모도로를 안 하면 포모가 온다!
      </p>

      {/* 아까 만든 TimerApp 부품을 여기에 끼워 넣습니다 */}
      <TimerApp />
      
    </main>
  );
}