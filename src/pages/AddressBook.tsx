
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  Users, 
  Building, 
  Mail, 
  Phone,
  MapPin,
  Heart,
  ChevronDown,
  Edit,
  Trash2,
  Star
} from "lucide-react";

// Mock data for contacts
const mockContacts = [
  {
    id: "c1",
    name: "Jane Cooper",
    type: "Client",
    company: "Cooper Design Studio",
    email: "jane.cooper@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, San Francisco, CA 94105",
    isFavorite: true,
    image: null
  },
  {
    id: "c2",
    name: "Michael Scott",
    type: "Client",
    company: "Dunder Mifflin",
    email: "michael.scott@example.com",
    phone: "(555) 234-5678",
    address: "1725 Slough Ave, Scranton, PA 18503",
    isFavorite: false,
    image: null
  },
  {
    id: "c3",
    name: "Sarah Williams",
    type: "Vendor",
    company: "Modern Furnishings Inc.",
    email: "sarah@modernfurnishings.com",
    phone: "(555) 345-6789",
    address: "456 Market St, Seattle, WA 98101",
    isFavorite: true,
    image: null
  },
  {
    id: "c4",
    name: "Robert Johnson",
    type: "Contractor",
    company: "Johnson & Sons Construction",
    email: "robert@johnsonconst.com",
    phone: "(555) 456-7890",
    address: "789 Builder Ave, Portland, OR 97205",
    isFavorite: false,
    image: null
  },
  {
    id: "c5",
    name: "Emily Chen",
    type: "Architect",
    company: "Chen Architecture",
    email: "emily@chenarch.com",
    phone: "(555) 567-8901",
    address: "321 Design Blvd, Chicago, IL 60601",
    isFavorite: false,
    image: null
  },
  {
    id: "c6",
    name: "David Miller",
    type: "Vendor",
    company: "Luxe Lighting Solutions",
    email: "david@luxelighting.com",
    phone: "(555) 678-9012",
    address: "555 Illumination Way, Los Angeles, CA 90028",
    isFavorite: true,
    image: null
  },
];

const contactTypes = ["All", "Client", "Vendor", "Contractor", "Architect"];

const AddressBook = () => {
  const [contacts, setContacts] = useState(mockContacts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Filter contacts based on search term, type, and favorites
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "All" || contact.type === selectedType;
    
    const matchesFavorites = !showFavoritesOnly || contact.isFavorite;
    
    return matchesSearch && matchesType && matchesFavorites;
  });
  
  const toggleFavorite = (id: string) => {
    setContacts(contacts.map(contact => 
      contact.id === id 
        ? { ...contact, isFavorite: !contact.isFavorite } 
        : contact
    ));
  };
  
  const getContactInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const getContactColor = (id: string) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-green-100 text-green-600",
      "bg-purple-100 text-purple-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600",
      "bg-indigo-100 text-indigo-600",
    ];
    
    // Use a hash function to generate a consistent color based on the ID
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Address Book</h1>
            <p className="text-muted-foreground">Manage clients, vendors, and other contacts</p>
          </div>
          <MotionButton variant="default" motion="subtle">
            <Plus size={18} className="mr-2" /> Add Contact
          </MotionButton>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {contactTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedType === type
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <Filter size={16} />
                <span>{type}</span>
              </button>
            ))}
            
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                showFavoritesOnly
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Heart size={16} />
              <span>Favorites</span>
            </button>
          </div>
        </div>

        {/* Contact List and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in animation-delay-[0.2s]">
          {/* Contact List */}
          <div className="lg:col-span-1">
            <GlassCard className="h-full">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-medium">Contacts ({filteredContacts.length})</h2>
              </div>
              
              <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="mx-auto mb-3 text-muted-foreground" size={32} />
                    <h3 className="text-lg font-medium mb-1">No contacts found</h3>
                    <p className="text-muted-foreground text-sm">Try a different search or filter</p>
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <div 
                      key={contact.id}
                      className={cn(
                        "p-4 hover:bg-secondary/40 cursor-pointer transition-colors",
                        selectedContact === contact.id && "bg-secondary/50"
                      )}
                      onClick={() => setSelectedContact(contact.id)}
                    >
                      <div className="flex items-center gap-3">
                        {contact.image ? (
                          <img 
                            src={contact.image} 
                            alt={contact.name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                            getContactColor(contact.id)
                          )}>
                            {getContactInitials(contact.name)}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{contact.name}</h3>
                            {contact.isFavorite && (
                              <Star className="h-4 w-4 text-amber-500 flex-shrink-0" fill="currentColor" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{contact.company}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
          
          {/* Contact Details */}
          <div className="lg:col-span-2">
            {selectedContact ? (
              <GlassCard className="h-full">
                {contacts.filter(c => c.id === selectedContact).map(contact => (
                  <div key={contact.id}>
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h2 className="text-lg font-medium">Contact Details</h2>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleFavorite(contact.id)}
                          className={cn(
                            "p-1.5 rounded-md text-foreground hover:bg-secondary transition-colors"
                          )}
                        >
                          <Heart 
                            size={18} 
                            className={contact.isFavorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"} 
                          />
                        </button>
                        <MotionButton variant="ghost" size="sm" motion="subtle">
                          <Edit size={16} className="mr-1" /> Edit
                        </MotionButton>
                        <MotionButton variant="ghost" size="sm" motion="subtle">
                          <Trash2 size={16} className="mr-1" /> Delete
                        </MotionButton>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
                        <div className="flex flex-col items-center">
                          {contact.image ? (
                            <img 
                              src={contact.image} 
                              alt={contact.name} 
                              className="w-24 h-24 rounded-full object-cover mb-2"
                            />
                          ) : (
                            <div className={cn(
                              "w-24 h-24 rounded-full flex items-center justify-center text-2xl font-medium mb-2",
                              getContactColor(contact.id)
                            )}>
                              {getContactInitials(contact.name)}
                            </div>
                          )}
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            contact.type === "Client" && "bg-blue-100 text-blue-600",
                            contact.type === "Vendor" && "bg-green-100 text-green-600",
                            contact.type === "Contractor" && "bg-amber-100 text-amber-600",
                            contact.type === "Architect" && "bg-purple-100 text-purple-600"
                          )}>
                            {contact.type}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <h1 className="text-2xl font-medium mb-1">{contact.name}</h1>
                          <p className="text-muted-foreground mb-4">{contact.company}</p>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                  {contact.email}
                                </a>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <a href={`tel:${contact.phone}`} className="hover:text-primary">
                                  {contact.phone}
                                </a>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p>{contact.address}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-md font-medium mb-3 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Related Projects
                          </h3>
                          <div className="bg-muted/30 rounded-lg p-4">
                            <ul className="space-y-2">
                              <li className="text-sm flex items-center justify-between">
                                <a href="#" className="hover:text-primary">Modern Loft Redesign</a>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                  In Progress
                                </span>
                              </li>
                              <li className="text-sm flex items-center justify-between">
                                <a href="#" className="hover:text-primary">Corporate Office Revamp</a>
                                <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                                  On Hold
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-md font-medium mb-3 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Recent Invoices
                          </h3>
                          <div className="bg-muted/30 rounded-lg p-4">
                            <ul className="space-y-2">
                              <li className="text-sm flex items-center justify-between">
                                <a href="#" className="hover:text-primary">Invoice #INV-2023-001</a>
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                  Paid
                                </span>
                              </li>
                              <li className="text-sm flex items-center justify-between">
                                <a href="#" className="hover:text-primary">Invoice #INV-2023-005</a>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                  Pending
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="text-md font-medium mb-3">Notes</h3>
                        <textarea 
                          className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                          placeholder="Add notes about this contact..."
                        ></textarea>
                        <div className="flex justify-end mt-3">
                          <MotionButton variant="default" size="sm" motion="subtle">
                            Save Notes
                          </MotionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </GlassCard>
            ) : (
              <GlassCard className="h-full flex items-center justify-center p-8 text-center">
                <div>
                  <User className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-xl font-medium mb-2">No Contact Selected</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Select a contact from the list to view their details, or add a new contact to your address book.
                  </p>
                  <MotionButton variant="default" motion="subtle">
                    <Plus size={18} className="mr-2" /> Add New Contact
                  </MotionButton>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AddressBook;
