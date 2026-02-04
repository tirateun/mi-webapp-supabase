// ChangePasswordModal.tsx
import { useState } from 'react';
import { supabase } from './supabaseClient';

interface ChangePasswordModalProps {
  user: any;
  onPasswordChanged: () => void;
  onCancel?: () => void;
}

export default function ChangePasswordModal({ user, onPasswordChanged }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validaciones
    if (newPassword !== confirmPassword) {
      setError('❌ Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setError('❌ La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword === 'Temporal123!') {
      setError('❌ Debes elegir una contraseña diferente a la temporal');
      return;
    }

    setLoading(true);

    try {
      // 1. ✅ Cambiar la contraseña usando Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // 2. ✅ CRÍTICO: Limpiar el flag must_change_password
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
          must_change_password: false,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (updateProfileError) {
        console.error('Error al actualizar perfil:', updateProfileError);
        // Intentar con RPC como fallback
        try {
          await supabase.rpc('clear_must_change_password', {
            user_id: user.id
          });
        } catch (rpcError) {
          console.error('Error en RPC:', rpcError);
        }
      }

      // 3. Notificar que terminó exitosamente
      onPasswordChanged();

    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      setError(error.message || 'Error al cambiar la contraseña');
      setLoading(false);
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(61, 26, 79, 0.85)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          width: '500px',
          maxWidth: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          animation: 'slideInDown 0.4s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
            padding: '1.5rem 2rem',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}
            >
              🔐
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                Cambio de Contraseña Obligatorio
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                Por seguridad, debes actualizar tu contraseña
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem' }}>
          <div
            style={{
              backgroundColor: '#FFF3E0',
              border: '1px solid #FFE0B2',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#E65100', display: 'block', marginBottom: '0.25rem' }}>
                Seguridad
              </strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5D4037' }}>
                Tu contraseña temporal debe ser cambiada antes de continuar. 
                Elige una contraseña segura que no uses en otros servicios.
              </p>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#FFEBEE',
                border: '1px solid #FFCDD2',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                color: '#C62828',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>⛔</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            {/* Nueva Contraseña */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="newPassword"
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                  color: '#3D1A4F',
                }}
              >
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  placeholder="Mínimo 8 caracteres"
                  style={{
                    width: '100%',
                    padding: '0.875rem 3rem 0.875rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid #E9ECEF',
                    outline: 'none',
                    fontSize: '0.95rem',
                    backgroundColor: '#F8F9FA',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#5B2C6F';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E9ECEF';
                    e.currentTarget.style.backgroundColor = '#F8F9FA';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#6C757D',
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small style={{ display: 'block', marginTop: '0.25rem', color: '#6C757D', fontSize: '0.8rem' }}>
                Debe tener al menos 8 caracteres
              </small>
            </div>

            {/* Confirmar Contraseña */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                  color: '#3D1A4F',
                }}
              >
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                placeholder="Repite la contraseña"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  border: '2px solid #E9ECEF',
                  outline: 'none',
                  fontSize: '0.95rem',
                  backgroundColor: '#F8F9FA',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5B2C6F';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E9ECEF';
                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                }}
              />
            </div>

            {/* Botón Actualizar */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading 
                  ? '#ADB5BD' 
                  : 'linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(91, 44, 111, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(91, 44, 111, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(91, 44, 111, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Actualizando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  Actualizar Contraseña
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#F8F9FA',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            borderTop: '1px solid #E9ECEF',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6C757D', textAlign: 'center' }}>
            <i className="bi bi-info-circle me-1"></i>
            No puedes omitir este paso por razones de seguridad
          </p>
        </div>
      </div>

      {/* CSS para animaciones */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}