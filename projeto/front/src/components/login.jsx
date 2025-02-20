import React from 'react';
import {MDBContainer, MDBCol, MDBRow, MDBBtn, MDBIcon, MDBInput, MDBCheckbox } from 'mdb-react-ui-kit';
import '../css/login.css';


function Login() {

  return (
    <div className="container">
        <h2>Sign up</h2>
        <input type="text" placeholder="User name" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button class="btn">Sign up</button>
        <div class="footer">
            <a href="#">Login</a>
        </div>
    </div>
    
  );
}

export default Login;