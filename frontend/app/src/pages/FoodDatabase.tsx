// AyuAahar - Food Database Page
import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import type { FoodItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageSkeleton from '@/components/PageSkeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Apple, Wheat, Carrot, Coffee, Cookie, Plus } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'grain': <Wheat className="h-4 w-4" />,
  'vegetable': <Carrot className="h-4 w-4" />,
  'fruit': <Apple className="h-4 w-4" />,
  'protein': <Cookie className="h-4 w-4" />,
  'dairy': <Coffee className="h-4 w-4" />,
  'spice': <Cookie className="h-4 w-4" />,
  'beverage': <Coffee className="h-4 w-4" />,
  'nuts': <Cookie className="h-4 w-4" />,
  'snack': <Cookie className="h-4 w-4" />,
};

export default function FoodDatabase() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [prakritiFilter, setPrakritiFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFood, setNewFood] = useState<Partial<FoodItem>>({
    name: '',
    category: 'vegetable',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    rasa: 'Madhura',
    guna: 'Guru',
    virya: 'cooling',
    vipaka: 'sweet',
    suitable_for: 'Vata, Pitta',
    meal_type: 'any',
  });

  useEffect(() => {
    fetchFoods();
  }, []);

  useEffect(() => {
    filterFoods();
  }, [searchQuery, categoryFilter, prakritiFilter, foods]);

  const fetchFoods = async () => {
    try {
      setIsLoading(true);
      const response = await api.getFoodItems();
      const items = response?.food_items || [];
      setFoods(items);
      setFilteredFoods(items);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFood = async () => {
    try {
      setIsSubmitting(true);
      await api.createFoodItem(newFood);
      toast.success('Food added successfully');
      setIsAddModalOpen(false);
      // Reset form
      setNewFood({
        name: '',
        category: 'vegetable',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        rasa: 'Madhura',
        guna: 'Guru',
        virya: 'cooling',
        vipaka: 'sweet',
        suitable_for: 'Vata, Pitta',
        meal_type: 'any',
      });
      fetchFoods();
    } catch (error) {
      console.error('Error adding food:', error);
      toast.error('Failed to add food');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterFoods = () => {
    let filtered = foods || [];

    if (searchQuery) {
      filtered = filtered.filter(f => 
        (f?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(f => f?.category === categoryFilter);
    }

    if (prakritiFilter) {
      filtered = filtered.filter(f => 
        (f?.suitable_for || '').toLowerCase().includes(prakritiFilter.toLowerCase())
      );
    }

    setFilteredFoods(filtered);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'grain': 'bg-saffron-200/50 text-saffron-700',
      'vegetable': 'bg-forest-200/50 text-forest-950',
      'fruit': 'bg-danger-soft text-danger',
      'protein': 'bg-purple-100 text-purple-800',
      'dairy': 'bg-blue-100 text-blue-800',
      'spice': 'bg-saffron-200/60 text-saffron-700',
      'beverage': 'bg-cyan-100 text-cyan-800',
      'nuts': 'bg-yellow-100 text-yellow-800',
      'snack': 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-sand-200 text-ink';
  };

  const getViryaColor = (virya: string) => {
    return virya === 'heating' 
      ? 'text-danger bg-danger-soft/40' 
      : 'text-blue-600 bg-blue-50';
  };

  const categories = Array.from(new Set((foods || []).map(f => f?.category).filter(Boolean)));

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Food Database</h1>
          <p className="text-ink-700">Browse foods with nutritional and Ayurvedic properties</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-forest-900 hover:bg-forest-800">
              <Plus className="mr-2 h-4 w-4" />
              Add Food
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Food Item</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newFood.name} onChange={(e) => setNewFood({...newFood, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newFood.category} onValueChange={(val: string) => setNewFood({...newFood, category: val})}>
                  <SelectTrigger id="category"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grain">Grain</SelectItem>
                    <SelectItem value="vegetable">Vegetable</SelectItem>
                    <SelectItem value="fruit">Fruit</SelectItem>
                    <SelectItem value="protein">Protein</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="spice">Spice</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                    <SelectItem value="nuts">Nuts</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2"><Label>Calories</Label><Input type="number" value={newFood.calories} onChange={(e) => setNewFood({...newFood, calories: parseFloat(e.target.value)})} /></div>
              <div className="space-y-2"><Label>Protein (g)</Label><Input type="number" value={newFood.protein} onChange={(e) => setNewFood({...newFood, protein: parseFloat(e.target.value)})} /></div>
              <div className="space-y-2"><Label>Carbs (g)</Label><Input type="number" value={newFood.carbs} onChange={(e) => setNewFood({...newFood, carbs: parseFloat(e.target.value)})} /></div>
              <div className="space-y-2"><Label>Fats (g)</Label><Input type="number" value={newFood.fats} onChange={(e) => setNewFood({...newFood, fats: parseFloat(e.target.value)})} /></div>
              
              <div className="space-y-2"><Label>Rasa (Taste)</Label><Input value={newFood.rasa} onChange={(e) => setNewFood({...newFood, rasa: e.target.value})} /></div>
              <div className="space-y-2"><Label>Guna (Qualities)</Label><Input value={newFood.guna} onChange={(e) => setNewFood({...newFood, guna: e.target.value})} /></div>
              <div className="space-y-2">
                <Label htmlFor="virya">Virya (Potency)</Label>
                <Select value={newFood.virya} onValueChange={(val: string) => setNewFood({...newFood, virya: val as FoodItem['virya']})}>
                  <SelectTrigger id="virya"><SelectValue placeholder="Virya" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heating">Heating</SelectItem>
                    <SelectItem value="cooling">Cooling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vipaka">Vipaka (Post-Digestive)</Label>
                <Select value={newFood.vipaka} onValueChange={(val: string) => setNewFood({...newFood, vipaka: val as FoodItem['vipaka']})}>
                  <SelectTrigger id="vipaka"><SelectValue placeholder="Vipaka" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sweet">Sweet</SelectItem>
                    <SelectItem value="sour">Sour</SelectItem>
                    <SelectItem value="pungent">Pungent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2"><Label>Suitable For (Doshas)</Label><Input value={newFood.suitable_for} onChange={(e) => setNewFood({...newFood, suitable_for: e.target.value})} placeholder="Vata, Pitta" /></div>
              <div className="space-y-2">
                <Label htmlFor="meal_type">Meal Type</Label>
                <Select value={newFood.meal_type} onValueChange={(val: string) => setNewFood({...newFood, meal_type: val as FoodItem['meal_type']})}>
                  <SelectTrigger id="meal_type"><SelectValue placeholder="Meal Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFood} disabled={isSubmitting} className="bg-forest-900 hover:bg-forest-800">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Food
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-ink-500" />
              <Input
                aria-label="Search foods"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger aria-label="Filter by category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat as string} value={cat as string}>
                    {(cat as string).charAt(0).toUpperCase() + (cat as string).slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={prakritiFilter} onValueChange={setPrakritiFilter}>
              <SelectTrigger aria-label="Suitable for prakriti">
                <SelectValue placeholder="Suitable for prakriti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Prakriti Types</SelectItem>
                <SelectItem value="Vata">Vata</SelectItem>
                <SelectItem value="Pitta">Pitta</SelectItem>
                <SelectItem value="Kapha">Kapha</SelectItem>
                <SelectItem value="Tridosha">Tridosha (All)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Food Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Food Items ({(filteredFoods || []).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Food</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Nutrition (per 100g)</TableHead>
                  <TableHead>Ayurvedic Properties</TableHead>
                  <TableHead>Suitable For</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredFoods || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-ink-500">
                      No foods match these filters. Try clearing the search or choosing another category.
                    </TableCell>
                  </TableRow>
                )}
                {(filteredFoods || []).map((food) => (
                  <TableRow key={food.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {CATEGORY_ICONS[food.category] || <Cookie className="h-4 w-4" />}
                        <span className="font-medium">{food.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(food.category)}>
                        {food.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{Math.round(food.calories || 0)} cal</p>
                        <p className="text-ink-500">
                          P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <p><span className="text-ink-500">Rasa:</span> {food.rasa}</p>
                        <p><span className="text-ink-500">Virya:</span> 
                          <Badge variant="outline" className={`ml-1 ${getViryaColor(food.virya)}`}>
                            {food.virya}
                          </Badge>
                        </p>
                        <p><span className="text-ink-500">Vipaka:</span> {food.vipaka}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(food.suitable_for || '').split(',').map((p, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {p.trim()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
