// AyuAahar - Patients List Page
import { prakritiBadge } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Patient } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  FileText,
  Utensils,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import PageSkeleton from '@/components/PageSkeleton';

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.prakriti.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPatients();
      setPatients(response.patients);
      setFilteredPatients(response.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    
    try {
      await api.deletePatient(patientToDelete.id);
      toast.success('Patient deleted successfully');
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    } finally {
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };


  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Patients</h1>
          <p className="text-ink-700">Manage your patient records</p>
        </div>
        <Button onClick={() => navigate('/patients/new')} className="bg-forest-900 hover:bg-forest-800">
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-ink-500" />
            <Input
              aria-label="Search patients"
              placeholder="Search patients by name or prakriti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Patients ({filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Prakriti</TableHead>
                  <TableHead>Health Conditions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="cursor-pointer hover:bg-sand-100">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-forest-200/50 flex items-center justify-center">
                          <User className="h-4 w-4 text-forest-900" />
                        </div>
                        <span className="font-medium">{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell className="capitalize">{patient.gender}</TableCell>
                    <TableCell>
                      <Badge className={prakritiBadge(patient.prakriti)}>
                        {patient.prakriti}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {patient.condition || 'None specified'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label={`Actions for ${patient.name}`}>
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/patients/${patient.id}`)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/patients/${patient.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/patients/${patient.id}/diet-plan`)}>
                            <Utensils className="mr-2 h-4 w-4" />
                            Diet Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(patient)}
                            className="text-danger"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-ink-300" />
              <h3 className="mt-4 text-lg font-medium text-ink">No patients found</h3>
              <p className="mt-1 text-ink-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding a new patient'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/patients/new')} 
                  className="mt-4 bg-forest-900 hover:bg-forest-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {patientToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
