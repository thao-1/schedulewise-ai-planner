
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8 animate-fade-in overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
