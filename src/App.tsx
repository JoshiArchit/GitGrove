import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";

function App() {
  const [value, setValue] = useState<string>("None");

  async function testInvoke() {
    const result = await invoke<string>("get_date_time");
    setValue(result);
  }

  return (
    <main className="bg-black">
      <div className="flex flex-col text-cyan-500">
        <span className="text-xl">Hey Archit</span>
        <span className="text-3xl">Welcome to GitGrove</span>
        <button className="bg-amber-200 px-4 py-2" onClick={testInvoke}>
          Test invoke
        </button>
        <span>{value}</span>
      </div>
    </main>
  );
}

export default App;
