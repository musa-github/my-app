import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout/Layout';

function App() {

  return (
   <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
      <Layout></Layout>
      </BrowserRouter>
  )
}

export default App
