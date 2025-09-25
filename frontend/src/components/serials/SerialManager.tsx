import React, { useState, useEffect } from 'react';

interface Serial {
  id: string;
  serial_number: string;
  product_name: string;
  status: string;
}

const SerialManager: React.FC = () => {
  const [serials, setSerials] = useState<Serial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSerials([]);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading serial numbers...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Serial Number Management</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {serials.length === 0 ? (
          <p>No serial numbers found</p>
        ) : (
          <div>Serial list will be here</div>
        )}
      </div>
    </div>
  );
};

export default SerialManager;