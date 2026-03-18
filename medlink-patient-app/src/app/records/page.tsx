'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Building2,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  FlaskConical,
  Pill,
  Scan,
  Receipt,
  FileCheck,
  Shield,
  Syringe,
  X,
  Filter,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Elements';
import { useSocket } from '@/hooks/useSocket';
import { recordsAPI } from '@/lib/api';
import { MedicalRecord, MedicalRecordType } from '@/types';
import Image from 'next/image';

const recordTypeIcons: Record<string, React.ReactNode> = {
  'Lab Report': <FlaskConical className="w-5 h-5" />,
  'Prescription': <Pill className="w-5 h-5" />,
  'Imaging': <Scan className="w-5 h-5" />,
  'Clinical Note': <FileText className="w-5 h-5" />,
  'Bill': <Receipt className="w-5 h-5" />,
  'Vaccination': <Syringe className="w-5 h-5" />,
  'Discharge Summary': <FileCheck className="w-5 h-5" />,
  'Insurance': <Shield className="w-5 h-5" />,
};

const defaultIcon = <FileText className="w-5 h-5" />;

interface HospitalGroup {
  hospitalId: string;
  hospitalName: string;
  address?: string;
  recordCount: number;
  dates: DateGroup[];
}

interface DateGroup {
  date: string;
  displayDate: string;
  reason: string;
  recordCount: number;
  records: MedicalRecord[];
}

export default function RecordsPage() {
  const { onRecordAdded, onRecordUpdated, onRecordDeleted } = useSocket();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [recordTypes, setRecordTypes] = useState<MedicalRecordType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [expandedHospitals, setExpandedHospitals] = useState<string[]>([]);
  const [expandedDates, setExpandedDates] = useState<Record<string, string[]>>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchRecords = useCallback(async () => {
    setIsFiltering(true);
    try {
      const response = await recordsAPI.getRecords({
        search: debouncedSearch || undefined,
        typeId: selectedType || undefined,
      });
      setRecords(response.data.records);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setIsFiltering(false);
    }
  }, [debouncedSearch, selectedType]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [typesRes] = await Promise.all([
        recordsAPI.getRecordTypes(),
      ]);
      
      setRecordTypes(typesRes.data.recordTypes);
      await fetchRecords();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRecords]);

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch records when search or filter changes
  useEffect(() => {
    if (!isLoading) {
      fetchRecords();
    }
  }, [debouncedSearch, selectedType, fetchRecords, isLoading]);

  // Reset expanded state when filters change
  useEffect(() => {
    setExpandedHospitals([]);
    setExpandedDates({});
  }, [debouncedSearch, selectedType]);

  useEffect(() => {
    const handleRecordAdded = () => fetchRecords();
    const handleRecordUpdated = () => fetchRecords();
    const handleRecordDeleted = () => fetchRecords();

    onRecordAdded(handleRecordAdded);
    onRecordUpdated(handleRecordUpdated);
    onRecordDeleted(handleRecordDeleted);
  }, [fetchRecords, onRecordAdded, onRecordUpdated, onRecordDeleted]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const extractReason = (record: MedicalRecord): string => {
    if (record.doctorSpecialization) {
      return `${record.doctorSpecialization} Consultation`;
    }
    if (record.doctorName) {
      return `${record.doctorName} Visit`;
    }
    if (record.recordType?.name) {
      return `${record.recordType.name} Visit`;
    }
    return 'Medical Visit';
  };

  const formatDateKey = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const groupedRecords = useMemo((): HospitalGroup[] => {
    const hospitalMap = new Map<string, HospitalGroup>();

    records.forEach(record => {
      const hospitalId = record.hospitalId || 'unknown';
      const hospitalName = record.hospitalName || 'Unknown Hospital';
      
      if (!hospitalMap.has(hospitalId)) {
        hospitalMap.set(hospitalId, {
          hospitalId,
          hospitalName,
          recordCount: 0,
          dates: []
        });
      }

      const hospital = hospitalMap.get(hospitalId)!;
      const dateKey = formatDateKey(record.date);
      
      let dateGroup = hospital.dates.find(d => d.date === dateKey);
      if (!dateGroup) {
        const reason = extractReason(record);
        dateGroup = {
          date: dateKey,
          displayDate: formatDate(record.date),
          reason: reason,
          recordCount: 0,
          records: []
        };
        hospital.dates.push(dateGroup);
      }

      dateGroup.records.push(record);
      dateGroup.recordCount++;
      hospital.recordCount++;
    });

    const hospitalGroups = Array.from(hospitalMap.values());

    hospitalGroups.forEach(hospital => {
      hospital.dates.sort((a, b) => b.date.localeCompare(a.date));
    });

    hospitalGroups.sort((a, b) => b.recordCount - a.recordCount);

    return hospitalGroups;
  }, [records]);

  const toggleHospital = (hospitalId: string) => {
    setExpandedHospitals(prev => 
      prev.includes(hospitalId)
        ? prev.filter(id => id !== hospitalId)
        : [...prev, hospitalId]
    );
  };

  const toggleDate = (hospitalId: string, date: string) => {
    setExpandedDates(prev => {
      const hospitalDates = prev[hospitalId] || [];
      return {
        ...prev,
        [hospitalId]: hospitalDates.includes(date)
          ? hospitalDates.filter(d => d !== date)
          : [...hospitalDates, date]
      };
    });
  };

  const handleViewImage = (record: MedicalRecord) => {
    if (record.fileUrl) {
      setSelectedRecord(record);
    }
  };

  const handleDownload = (record: MedicalRecord) => {
    if (record.fileUrl) {
      const link = document.createElement('a');
      link.href = record.fileUrl;
      link.download = `${record.title.replace(/\s+/g, '_')}.png`;
      link.target = '_blank';
      link.click();
    }
  };

  const getRecordTypeIcon = (typeName: string) => {
    return recordTypeIcons[typeName] || defaultIcon;
  };

  const getTotalStats = () => {
    const hospitals = groupedRecords.length;
    const totalRecords = records.length;
    const latestDate = records.length > 0 ? formatDate(records[0].date) : 'N/A';
    return { hospitals, totalRecords, latestDate };
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setDebouncedSearch('');
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Medical Records</h1>
        <p className="text-text-secondary text-sm lg:text-base">View your medical history organized by hospital</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hospitals</p>
              <p className="text-2xl font-bold text-primary">{stats.hospitals}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-primary">{stats.totalRecords}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-primary/5 border-primary/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Latest Record</p>
              <p className="text-lg font-bold text-primary">{stats.latestDate}</p>
            </div>
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by record title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {isFiltering && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
              )}
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="w-4 h-4 text-gray-400" />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="">All Record Types</option>
                {recordTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || selectedType) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedType) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  Search: &quot;{searchTerm}&quot;
                </span>
              )}
              {selectedType && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  Type: {recordTypes.find(t => t.id === selectedType)?.name || selectedType}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {records.length} {records.length === 1 ? 'result' : 'results'} found
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : groupedRecords.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No records found</p>
            {(searchTerm || selectedType) && (
              <button
                onClick={handleClearFilters}
                className="text-primary hover:underline text-sm"
              >
                Clear filters to see all records
              </button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {groupedRecords.map((hospital) => (
              <Card key={hospital.hospitalId} className="overflow-hidden">
                <button
                  onClick={() => toggleHospital(hospital.hospitalId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`transition-transform duration-200 ${expandedHospitals.includes(hospital.hospitalId) ? 'rotate-90' : ''}`}>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">{hospital.hospitalName}</h3>
                      <p className="text-sm text-gray-500">{hospital.recordCount} {hospital.recordCount === 1 ? 'record' : 'records'}</p>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedHospitals.includes(hospital.hospitalId) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-2 space-y-1">
                        {hospital.dates.map((dateGroup) => {
                          const isDateExpanded = expandedDates[hospital.hospitalId]?.includes(dateGroup.date) || false;
                          return (
                            <div key={dateGroup.date}>
                              <button
                                onClick={() => toggleDate(hospital.hospitalId, dateGroup.date)}
                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`transition-transform duration-200 ${isDateExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-700">{dateGroup.displayDate}</span>
                                  <span className="text-gray-400">-</span>
                                  <span className="text-sm text-emerald-600 font-medium">{dateGroup.reason}</span>
                                </div>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {dateGroup.recordCount} {dateGroup.recordCount === 1 ? 'record' : 'records'}
                                </span>
                              </button>

                              <AnimatePresence>
                                {isDateExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="ml-6 pl-4 border-l-2 border-emerald-200 space-y-2 py-2"
                                  >
                                    {dateGroup.records.map((record) => (
                                      <div
                                        key={record.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center text-emerald-600 flex-shrink-0">
                                            {getRecordTypeIcon(record.recordType.name)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 text-sm truncate">{record.title}</p>
                                            {record.description && (
                                              <p className="text-xs text-gray-500 truncate group-hover:text-gray-700 transition-colors" title={record.description}>
                                                {record.description}
                                              </p>
                                            )}
                                            <p className="text-xs text-gray-400">
                                              {record.recordType.name}
                                              {record.doctorName && ` • ${record.doctorName}`}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {record.fileUrl && (
                                            <>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleViewImage(record); }}
                                                className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                                                title="View"
                                              >
                                                <Eye className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(record); }}
                                                className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                                                title="Download"
                                              >
                                                <Download className="w-4 h-4" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setSelectedRecord(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedRecord.title}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedRecord.recordType.name} • {formatDate(selectedRecord.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(selectedRecord)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setSelectedRecord(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-center bg-gray-100 min-h-[400px]">
                  {selectedRecord.fileUrl ? (
                    <Image 
                      src={selectedRecord.fileUrl} 
                      alt={selectedRecord.title}
                      width={400}
                      height={300}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                      unoptimized
                    />
                  ) : (
                    <div className="text-center">
                      <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                </div>
                {selectedRecord.description && (
                  <div className="p-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Details</h4>
                    <p className="text-sm text-gray-600">{selectedRecord.description}</p>
                    {selectedRecord.hospitalName && (
                      <p className="text-sm text-gray-500 mt-2">
                        <Building2 className="w-4 h-4 inline mr-1" />
                        {selectedRecord.hospitalName}
                      </p>
                    )}
                    {selectedRecord.doctorName && (
                      <p className="text-sm text-gray-500">
                        {selectedRecord.doctorName}
                        {selectedRecord.doctorSpecialization && ` - ${selectedRecord.doctorSpecialization}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
