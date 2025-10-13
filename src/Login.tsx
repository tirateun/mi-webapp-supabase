import React, { useState } from "react";
import {
  MDBContainer,
  MDBCol,
  MDBRow,
  MDBBtn,
  MDBIcon,
  MDBInput,
  MDBCheckbox,
} from "mdb-react-ui-kit";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin, onRequirePasswordChange }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("❌ Credenciales incorrectas o usuario no registrado.");
      setLoading(false);
      return;
    }

    const { user } = data;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", user.id)
        .single();

      if (profile?.must_change_password) {
        onRequirePasswordChange(user);
      } else {
        onLogin(user);
      }
    }

    setLoading(false);
  };

  return (
    <MDBContainer fluid className="p-3 my-5 h-custom">
      <MDBRow className="d-flex align-items-center">
        {/* Imagen lateral */}
        <MDBCol md="6" className="text-center mb-4 mb-md-0">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            className="img-fluid"
            alt="Login ilustración"
            style={{ maxHeight: "450px" }}
          />
        </MDBCol>

        {/* Formulario */}
        <MDBCol md="6">
          <div className="text-center mb-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/8/83/UNMSM_coatofarms.svg"
              alt="Logo UNMSM"
              width={80}
              className="mb-3"
            />
            <h3 className="fw-bold text-primary">Acceso al Sistema</h3>
            <p className="text-muted">Facultad de Medicina San Fernando UNMSM</p>
          </div>

          <MDBInput
            wrapperClass="mb-4"
            label="Correo electrónico"
            id="email"
            type="email"
            size="lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <MDBInput
            wrapperClass="mb-4"
            label="Contraseña"
            id="password"
            type="password"
            size="lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="d-flex justify-content-between mb-4">
            <MDBCheckbox
              name="flexCheck"
              id="flexCheckDefault"
              label="Recordarme"
            />
            <a href="#!" className="text-primary">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {error && (
            <p className="text-danger text-center mb-3" style={{ fontWeight: 500 }}>
              {error}
            </p>
          )}

          <div className="text-center text-md-start mt-4 pt-2">
            <MDBBtn
              className="mb-0 px-5"
              size="lg"
              style={{
                backgroundColor: "#003366",
                color: "white",
                borderRadius: "10px",
              }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </MDBBtn>
          </div>
        </MDBCol>
      </MDBRow>

      <footer
        className="d-flex flex-column flex-md-row text-center text-md-start justify-content-between py-3 px-4 mt-5"
        style={{ backgroundColor: "#003366", color: "white", borderRadius: "8px" }}
      >
        <div className="mb-3 mb-md-0">
          © 2025 - Facultad de Medicina San Fernando UNMSM
        </div>

        <div>
          <MDBBtn tag="a" color="none" className="mx-2" style={{ color: "white" }}>
            <MDBIcon fab icon="facebook-f" size="md" />
          </MDBBtn>
          <MDBBtn tag="a" color="none" className="mx-2" style={{ color: "white" }}>
            <MDBIcon fab icon="twitter" size="md" />
          </MDBBtn>
          <MDBBtn tag="a" color="none" className="mx-2" style={{ color: "white" }}>
            <MDBIcon fab icon="linkedin-in" size="md" />
          </MDBBtn>
        </div>
      </footer>
    </MDBContainer>
  );
}










