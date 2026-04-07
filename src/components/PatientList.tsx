import { useState } from 'react';
import { Plus, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePatients, useCreatePatient, useHealthCheck, type Patient } from '@/hooks/useApi';

interface PatientCardProps {
  patient: Patient;
}

function PatientCard({ patient }: PatientCardProps) {
  const getConditionColor = (condition?: string) => {
    if (!condition) return 'secondary';
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('critical') || lowerCondition.includes('emergency')) return 'destructive';
    if (lowerCondition.includes('stable')) return 'default';
    if (lowerCondition.includes('observation')) return 'secondary';
    return 'outline';
  };

  const getConditionIcon = (condition?: string) => {
    if (!condition) return <User className="w-4 h-4" />;
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('critical') || lowerCondition.includes('emergency')) {
      return <AlertCircle className="w-4 h-4" />;
    }
    if (lowerCondition.includes('stable')) {
      return <CheckCircle className="w-4 h-4" />;
    }
    return <User className="w-4 h-4" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              {getConditionIcon(patient.condition)}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{patient.name}</h3>
              <p className="text-xs text-muted-foreground">Age: {patient.age}</p>
            </div>
          </div>
          {patient.condition && (
            <Badge variant={getConditionColor(patient.condition)} className="text-xs">
              {patient.condition}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddPatientDialog({ open, onOpenChange }: AddPatientDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    condition: '',
  });

  const createPatient = useCreatePatient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatient.mutateAsync({
        name: formData.name,
        age: parseInt(formData.age),
        condition: formData.condition || undefined,
      });
      setFormData({ name: '', age: '', condition: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create patient:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              required
              min="0"
              max="150"
            />
          </div>
          <div>
            <Label htmlFor="condition">Condition (Optional)</Label>
            <Textarea
              id="condition"
              value={formData.condition}
              onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
              placeholder="e.g., stable, under observation, critical"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPatient.isPending}>
              {createPatient.isPending ? 'Adding...' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PatientList() {
  const { data: patients, isLoading, error } = usePatients();
  const { data: healthData } = useHealthCheck();
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Patient Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading patient data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Patient Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">Failed to load patient data</p>
            <p className="text-xs text-muted-foreground mt-1">
              Make sure the backend server is running on port 4000
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Patient Data</span>
            {healthData && (
              <Badge variant="outline" className="text-xs">
                Backend: {healthData.status}
              </Badge>
            )}
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {patients && patients.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No patients in the system</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first patient to get started
            </p>
          </div>
        )}
      </CardContent>
      <AddPatientDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </Card>
  );
}
