import React, { useState } from 'react';
import { MDBContainer, MDBCol, MDBRow, MDBBtn, MDBInput } from 'mdb-react-ui-kit';
import '../css/login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const response = await fetch('http://localhost:4000/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token); // Guardar token no localStorage
      setMessage('Login bem-sucedido!');
      window.location.href = "/dashboard"; // Redirecionar para outra página
    } else {
      setMessage(data.message);
    }
  };

  return (
    <MDBContainer fluid className="p-3 my-5 h-custom">
      <MDBRow>
        <MDBCol col='10' md='6'></MDBCol>
        <MDBCol col='4' md='6'>

          <div className="divider d-flex align-items-center my-4">
            <p className="text-center fw-bold mx-3 mb-0">Login</p>
          </div>

          <MDBInput 
            wrapperClass='mb-4' 
            label='Email address' 
            type='email' 
            size="lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <MDBInput 
            wrapperClass='mb-4' 
            label='Password' 
            type='password' 
            size="lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message && <p className="text-danger">{message}</p>}

          <div className='text-center text-md-start mt-4 pt-2'>
            <MDBBtn className="mb-0 px-5" size='lg' onClick={handleLogin}>
              Login
            </MDBBtn>
          </div>

        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
}

export default Login;
