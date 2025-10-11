import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Login from "./Login";
import AgreementsList from "./AgreementsList";
import AgreementsForm from "./AgreementsForm";
import InstitucionesList from "./InstitucionesList";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [page, setPage] = useState<
    "agreementsList" | "agreementsForm" | "instituciones" | "users"
  >("agreementsList");
  const [editingAgreement, setEditingAgreement] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0); // ✅ fuerza recarga

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session)
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!session) {
    return (
      <Login
        onLogin={(user) => setSession({ user })}
        onRequirePasswordChange={() => {}}
      />
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleCreateAgreement = () => {
    setEditingAgreement(null);
    setPage("agreementsForm");
  };

  const handleEditAgreement = (agreement: any) => {
    setEditingAgreement(agreement);
    setPage("agreementsForm");
  };

  const handleSaveAgreement = () => {
    setPage("agreementsList");
    setRefreshKey((prev) => prev + 1); // ✅ actualiza lista al guardar
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onNavigate={setPage} onLogout={handleLogout} />

      <main className="flex-1 p-6">
        {page === "agreementsList" && (
          <AgreementsList
            key={refreshKey} // ✅ fuerza render actualizado
            user={session.user}
            role="admin"
            onEdit={handleEditAgreement}
            onCreate={handleCreateAgreement}
          />
        )}

        {page === "agreementsForm" && (
          <AgreementsForm
            existingAgreement={editingAgreement}
            onSave={handleSaveAgreement}
            onCancel={() => setPage("agreementsList")}
          />
        )}

        {page === "instituciones" && <InstitucionesList />}
      </main>
    </div>
  );
}


















