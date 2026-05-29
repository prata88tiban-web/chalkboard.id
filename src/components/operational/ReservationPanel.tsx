'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, TextInput, Label, Badge } from 'flowbite-react';
import { IconCalendarEvent, IconPlus, IconPhone, IconClock } from '@tabler/icons-react';

interface Reservation {
  id: number;
  customerName: string;
  customerPhone: string;
  scheduledTime: string;
  duration: number;
  status: string;
}

const ReservationPanel = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    scheduledTime: '',
    duration: '60'
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const res = await fetch('/api/reservations');
    if (res.ok) setReservations(await res.json());
  };

  const handleAdd = async () => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      fetchReservations();
      setShowAddModal(false);
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <IconCalendarEvent className="w-5 h-5 text-primary" />
          Today's Reservations
        </h3>
        <Button size="xs" onClick={() => setShowAddModal(true)}>
          <IconPlus className="w-4 h-4 mr-1" /> Book
        </Button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {reservations.length === 0 && <p className="text-center text-bodytext py-4">No reservations yet</p>}
        {reservations.map((res) => (
          <div key={res.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-primary">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm">{res.customerName}</p>
              <Badge color="info">{new Date(res.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Badge>
            </div>
            <p className="text-xs text-bodytext flex items-center gap-1 mt-1">
              <IconPhone className="w-3 h-3" /> {res.customerPhone}
            </p>
          </div>
        ))}
      </div>

      <Modal show={showAddModal} onClose={() => setShowAddModal(false)}>
        <Modal.Header>Book Table</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label value="Customer Name" />
              <TextInput value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />
            </div>
            <div>
              <Label value="Phone Number" />
              <TextInput icon={IconPhone} value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} />
            </div>
            <div>
              <Label value="Time" />
              <TextInput type="datetime-local" value={formData.scheduledTime} onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleAdd}>Confirm Booking</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ReservationPanel;
