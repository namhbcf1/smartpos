import React, { useState, useEffect } from 'react';

interface Warranty {
  id: string;
  product_name: string;
  customer_name: string;
  status: string;
  created_at: string;
}

const WarrantyManager: React.FC = () => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    setWarranties([]);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading warranties...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Warranty Management</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {warranties.length === 0 ? (
          <p>No warranties found</p>
        ) : (
          <div>Warranty list will be here</div>
        )}
      </div>
    </div>
  );
};

export default WarrantyManager;