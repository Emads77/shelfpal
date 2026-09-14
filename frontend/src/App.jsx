import {useEffect, useState} from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://localhost:8000/api/ping')
        .then((res) => res.json())
        .then((data) => setMessage(data.message))
        .catch(() => setMessage('Failed to reach backend'));
  }, []);

  return <h1>{message}</h1>;
}

export default App
