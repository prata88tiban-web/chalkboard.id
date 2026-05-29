'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal, TextInput, Label, Alert } from 'flowbite-react';
import { IconDoorEnter, IconDoorExit, IconWallet, IconFileDescription } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

interface Staff {
  id: number;
  name: string;
}

interface Shift {
  id: number;
  staffId: number;
  status: 'open' | 'closed';
  startBalance: string;
  startTime: string;
}

const ShiftManager = () => {
  const { data: session } = useSession();
  const t = useTranslations('Dashboard');
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [startBalance, setStartBalance] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveShift();
  }, []);

  const fetchActiveShift = async () => {
    try {
      const res = await fetch('/api/shifts');
      if (res.ok) {
        const shifts = await res.json();
        const active = shifts.find((s: Shift) => s.status === 'open');
        setActiveShift(active || null);
      }
    } catch (error) {
      console.error('Failed to fetch shifts');
    }
  };

  const handleOpenShift = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: parseInt(session.user.id), startBalance }),
      });
      if (res.ok) {
        await fetchActiveShift();
        setShowOpenModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    setLoading(true);
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeShift.id,
          endBalance: '0', // Should be calculated
          actualCash,
          notes,
        }),
      });
      if (res.ok) {
        setActiveShift(null);
        setShowCloseModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {activeShift ? (
        <Alert color="success" icon={IconDoorEnter}>
          <div className="flex justify-between items-center">
            <span>
              <strong>Shift Active</strong> since {new Date(activeShift.startTime).toLocaleString()}
            </span>
            <Button color="failure" size="xs" onClick={() => setShowCloseModal(true)}>
              <IconDoorExit className="w-4 h-4 mr-2" />
              Close Shift
            </Button>
          </div>
        </Alert>
      ) : (
        <Alert color="warning" icon={IconDoorExit}>
          <div className="flex justify-between items-center">
            <span><strong>No Active Shift</strong>. Please open a shift to start operations.</span>
            <Button color="success" size="xs" onClick={() => setShowOpenModal(true)}>
              <IconDoorEnter className="w-4 h-4 mr-2" />
              Open Shift
            </Button>
          </div>
        </Alert>
      )}

      {/* Open Shift Modal */}
      <Modal show={showOpenModal} onClose={() => setShowOpenModal(false)}>
        <Modal.Header>Open New Shift</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label value="Starting Cash Balance" />
              <TextInput
                icon={IconWallet}
                type="number"
                value={startBalance}
                onChange={(e) => setStartBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleOpenShift} loading={loading}>Start Shift</Button>
          <Button color="secondary" onClick={() => setShowOpenModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Close Shift Modal */}
      <Modal show={showCloseModal} onClose={() => setShowCloseModal(false)}>
        <Modal.Header>Close Current Shift</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label value="Actual Cash in Drawer" />
              <TextInput
                icon={IconWallet}
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label value="Closing Notes" />
              <TextInput
                icon={IconFileDescription}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any discrepancies?"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={handleCloseShift} loading={loading}>Close Shift & Reconcile</Button>
          <Button color="secondary" onClick={() => setShowCloseModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShiftManager;
