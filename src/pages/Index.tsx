import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center">
      <div className="text-center space-y-8 text-white">
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-bold">ABROB-GT</h1>
            <p className="text-xl text-white/90">AI-powered GPS tracking</p>
          </div>
        </div>
        
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Revolutionary GPS tracking with AI intelligence, real-time monitoring, 
          and self-defending capabilities.
        </p>
        
        <Button 
          size="lg" 
          onClick={() => navigate('/auth')}
          className="gradient-secondary text-white font-semibold px-8 py-4"
        >
          Access Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Index;
