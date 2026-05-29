'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, TextInput, Label, Badge } from 'flowbite-react';
import { IconUsers, IconPlus, IconUserCheck, IconX } from '@tabler/icons-react';

interface QueueItem {
  id: number;
  customerName: string;
  groupSize: number;
  status: string;
  createdAt: string;
}

const QueueManager = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [groupSize, setGroupSize] = useState('1');

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    const res = await fetch('/api/queues');
    if (res.ok) setQueue(await res.json());
  };

  const handleAddToQueue = async () => {
    const res = await fetch('/api/queues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, groupSize: parseInt(groupSize) }),
    });
    if (res.ok) {
      fetchQueue();
      setShowAddModal(false);
      setCustomerName('');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch('/api/queues', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) fetchQueue();
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <IconUsers className="w-5 h-5 text-primary" />
          Waiting Queue
        </h3>
        <Button size="xs" onClick={() => setShowAddModal(true)}>
          <IconPlus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {queue.length === 0 && <p className="text-center text-bodytext py-4">No one in queue</p>}
        {queue.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-bold text-sm">{item.customerName}</p>
              <p className="text-xs text-bodytext">{item.groupSize} People • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleStatusChange(item.id, 'seated')} className="p-1 text-success hover:bg-success/10 rounded">
                <IconUserCheck className="w-5 h-5" />
              </button>
              <button onClick={() => handleStatusChange(item.id, 'cancelled')} className="p-1 text-error hover:bg-error/10 rounded">
                <IconX className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal show={showAddModal} onClose={() => setShowAddModal(false)}>
        <Modal.Header>Add to Waiting List</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label value="Customer Name" />
              <TextInput value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter name" />
            </div>
            <div>
              <Label value="Group Size" />
              <TextInput type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleAddToQueue}>Add to Queue</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default QueueManager;
