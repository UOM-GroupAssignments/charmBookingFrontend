import { useState } from 'react'
import logger from '../../../utils/logger'
import {
  faUsers,
  faPlus,
  faEdit,
  faTrash,
  faPhone,
  faEnvelope,
  faCalendar,
  faCalendarDays,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Spinner,
  Checkbox,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from '@heroui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../../../components/commonModal'
import {
  addSalonWorker,
  addWorkerLeaves,
  getSalonLeaves,
  getSalonServices,
  getSalonWorkers,
} from '../../../actions/salonActions'
import useAuthUser from 'react-auth-kit/hooks/useAuthUser'
import {
  BaseSalonWorker,
  CreateWorkerDto,
  LeaveInput,
  SalonAdmin,
  SalonWorker,
  WorkerLeaveRequest,
} from '../../../types/salon'
import CommonModal from '../../../components/commonModal'
import { WorkerScheduler } from '../../../components/WorkerScheduler'

export function WorkersPage() {
  const admin = useAuthUser<SalonAdmin>()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState<'workers' | 'leave'>('workers')

  // Fetch workers
  const { data: workers = [], isPending: loadingWorkersData } = useQuery({
    queryKey: ['workers', admin?.salonId],
    queryFn: () => getSalonWorkers(admin!.salonId),
    enabled: !!admin?.salonId,
  })

  //fetch leaves
  const { data: leaves, isPending: loadingLeaves } = useQuery({
    queryKey: ['leaves', admin?.salonId],
    queryFn: () => getSalonLeaves(admin!.salonId),
    enabled: !!admin?.salonId,
  })

  //fetch services
  const { data: services, isPending: loadingServices } = useQuery({
    queryKey: ['services', admin?.salonId],
    queryFn: () => getSalonServices(admin!.salonId),
    enabled: !!admin?.salonId,
  })

  //add worker
  const { mutate: createWorker, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateWorkerDto) => addSalonWorker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      setShowAddModal(false)
      setNewWorker({ name: '', salonId: admin?.salonId || '', services: [] })
      addToast({
        color: 'success',
        title: 'Worker added successfully',
        description: 'The worker has been added to your salon.',
      })
    },
    onError: error => {
      addToast({
        color: 'danger',
        title: 'Failed to add worker',
        description: 'An error occurred while adding the worker.',
      })
      logger.error('Error adding worker:', error)
    },
  })

  const deleteWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return new Promise(resolve => setTimeout(() => resolve(workerId), 300))
    },
    // onSuccess: workerId => {
    //   queryClient.setQueryData<Worker[]>(['workers'], old =>
    //     (old ?? []).filter(w => w.id !== workerId),
    //   )
    // },
  })

  const { mutate: addLeave, isPending: addingLeave } = useMutation({
    mutationFn: (data: WorkerLeaveRequest) =>
      addWorkerLeaves(selectedWorker!.workerId, admin!.salonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      setShowLeaveModal(false)
      setLeaveInputs([])
      setNewLeave({ date: '', startTime: '', endTime: '' })
      addToast({
        color: 'success',
        title: 'Leave added successfully',
        description: 'The leave has been added for the worker.',
      })
    },
    onError: error => {
      addToast({
        color: 'danger',
        title: 'Failed to add leave',
        description: 'An error occurred while adding the leave.',
      })
      logger.error('Error adding leave:', error)
    },
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<SalonWorker | null>(null)
  const [newWorker, setNewWorker] = useState<CreateWorkerDto>({
    salonId: admin!.salonId,
    name: '',
    services: [],
  })
  const [leaveInputs, setLeaveInputs] = useState<LeaveInput[]>([])
  const [newLeave, setNewLeave] = useState<LeaveInput>({
    date: '',
    startTime: '',
    endTime: '',
  })

  const handleDeleteWorker = (id: string) => {
    deleteWorkerMutation.mutate(id)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-start'>
        {selectedTab === 'workers' ? (
          <>
            <div>
              <h2 className='text-3xl font-bold'>Workers Management</h2>
              <p className='text-gray-500'>Manage your salon staff and their schedules</p>
            </div>
            <Button onPress={() => setShowAddModal(true)} color='primary'>
              <FontAwesomeIcon icon={faPlus} className='mr-2' />
              Add Worker
            </Button>
          </>
        ) : (
          <>
            <div>
              <h2 className='text-3xl font-bold'>Leave Management</h2>
              <p className='text-gray-500'>Manage your workers' leave requests</p>
            </div>
            <Button onPress={() => setShowLeaveModal(true)} color='primary'>
              <FontAwesomeIcon icon={faPlus} className='mr-2' />
              Add Leave
            </Button>
          </>
        )}
      </div>

      <Tabs
        aria-label='Workers Management Tabs'
        selectedKey={selectedTab}
        onSelectionChange={key => setSelectedTab(key as 'workers' | 'leave')}
      >
        <Tab
          key='schedules'
          title={
            <span>
              <FontAwesomeIcon icon={faUsers} className='mr-2' />
              Worker Schedules
            </span>
          }
        >
          <WorkerScheduler />
        </Tab>
        <Tab
          key='workers'
          title={
            <span>
              <FontAwesomeIcon icon={faUsers} className='mr-2' />
              Workers
            </span>
          }
        >
          {loadingWorkersData ? (
            <Spinner label='Loading workers...' />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {workers.map(worker => (
                <Card key={worker.workerId}>
                  <CardHeader className='flex justify-between items-center'>
                    <div className='flex gap-3 items-center'>
                      <Avatar size='sm' name={worker.name} />
                      <div>
                        <h4 className='font-semibold'>{worker.name}</h4>
                      </div>
                    </div>
                    <Chip color={worker.status === 'active' ? 'success' : 'warning'}>
                      {worker.status}
                    </Chip>
                  </CardHeader>
                  <CardBody>
                    <div className='mt-2'>
                      <p className='text-sm font-medium'>Services:</p>
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {worker.services.map(s => (
                          <Chip key={typeof s === 'string' ? s : s.id ?? s.name} variant='flat'>
                            {typeof s === 'string' ? s : s.name}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div className='flex gap-2 mt-4'>
                      <Button size='sm' variant='flat' onPress={() => setSelectedWorker(worker)}>
                        <FontAwesomeIcon icon={faEdit} className='mr-1' /> Edit
                      </Button>
                      <Button size='sm' variant='flat' onPress={() => setShowLeaveModal(true)}>
                        <FontAwesomeIcon icon={faCalendarDays} />
                      </Button>
                      <Button
                        size='sm'
                        color='danger'
                        onPress={() => handleDeleteWorker(worker.workerId)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </Tab>

        <Tab
          key='leave'
          title={
            <span>
              <FontAwesomeIcon icon={faCalendar} className='mr-2' />
              Leave Schedule
            </span>
          }
        >
          {loadingLeaves ? (
            <Spinner label='Loading leave schedule...' />
          ) : leaves && leaves.length > 0 ? (
            <div className='space-y-4'>
              {leaves.map(workerLeave => (
                <Card key={workerLeave.workerId} className='overflow-hidden'>
                  <CardHeader className='bg-gray-50'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold mr-2'>{workerLeave.name}</h3>
                      <Chip color='primary'>{workerLeave.leaves.length} leaves</Chip>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {workerLeave.leaves.length === 0 ? (
                      <p className='text-sm text-gray-500'>No scheduled leaves</p>
                    ) : (
                      <div className='space-y-2'>
                        {workerLeave.leaves.map(leave => (
                          <div
                            key={leave.id}
                            className='flex items-center justify-between p-2 rounded-lg border'
                          >
                            <div>
                              <p className='font-medium'>
                                {new Date(leave.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className='text-sm text-gray-500'>
                                {leave.startTime.slice(0, 5)} - {leave.endTime.slice(0, 5)}
                              </p>
                            </div>
                            {/* <Button
                              size='sm'
                              color='danger'
                              variant='flat'
                              onPress={() => handleDeleteLeave(leave.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button> */}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className='text-center p-8 bg-gray-50 rounded-lg'>
              <p className='text-gray-500'>No leave schedules found</p>
            </div>
          )}
        </Tab>
      </Tabs>
      {/* Add Worker Modal */}
      <CommonModal
        isOpen={showAddModal}
        onOpenChange={setShowAddModal}
        title='Add Worker'
        footer={
          <div className='flex justify-end gap-2'>
            <Button variant='flat' onPress={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              color='primary'
              isDisabled={!newWorker.name || newWorker.services.length === 0 || isCreating}
              onPress={() => createWorker(newWorker)}
            >
              {isCreating ? 'Adding...' : 'Add Worker'}
            </Button>
          </div>
        }
      >
        <div className='space-y-4'>
          <Input
            label='Name'
            value={newWorker.name}
            onChange={e => setNewWorker({ ...newWorker, name: e.target.value })}
            placeholder='Enter worker name'
            isRequired
          />

          <div className='space-y-2'>
            <p className='text-sm font-medium'>Services</p>
            <div className='space-y-2'>
              {services?.map(service => (
                <Checkbox
                  key={service.serviceId}
                  isSelected={newWorker.services.includes(service.name)}
                  onChange={() => {
                    setNewWorker(prev => ({
                      ...prev,
                      services: prev.services.includes(service.name)
                        ? prev.services.filter(s => s !== service.name)
                        : [...prev.services, service.name],
                    }))
                  }}
                >
                  {service.name}
                </Checkbox>
              ))}
            </div>
          </div>
        </div>
      </CommonModal>

      {/* Add Leave Modal */}
      <CommonModal
        isOpen={showLeaveModal}
        onOpenChange={(isOpen: boolean) => {
          setShowLeaveModal(isOpen)

          if (!isOpen) {
            // Reset state when modal closes
            setSelectedWorker(null)
            setLeaveInputs([])
            setNewLeave({ date: '', startTime: '', endTime: '' })
          }
        }}
        title='Add Leave'
        footer={
          <div className='flex justify-end gap-2'>
            <Button variant='flat' onPress={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
            <Button
              color='primary'
              isDisabled={!selectedWorker || leaveInputs.length === 0 || addingLeave}
              onPress={() =>
                addLeave({
                  leaveInputs,
                })
              }
            >
              {addingLeave ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className='space-y-4'>
          {/* Select Worker */}
          <Select
            label='Select Worker'
            placeholder='Choose a worker'
            selectedKeys={selectedWorker ? [selectedWorker.workerId] : []}
            onSelectionChange={keys => {
              const selectedId = Array.from(keys)[0] as string
              const worker = workers.find(w => w.workerId === selectedId) || null
              setSelectedWorker(worker)
            }}
          >
            {workers.map(worker => (
              <SelectItem key={worker.workerId}>{worker.name}</SelectItem>
            ))}
          </Select>

          {/* Date & Time Inputs */}
          <Input
            type='date'
            label='Date'
            value={newLeave.date}
            onChange={e => setNewLeave({ ...newLeave, date: e.target.value })}
          />
          <div className='grid grid-cols-2 gap-4'>
            <Input
              type='time'
              label='Start Time'
              value={newLeave.startTime}
              onChange={e => setNewLeave({ ...newLeave, startTime: e.target.value + ':00' })}
            />
            <Input
              type='time'
              label='End Time'
              value={newLeave.endTime}
              onChange={e => setNewLeave({ ...newLeave, endTime: e.target.value + ':00' })}
            />
          </div>

          {/* Add Leave Button */}
          <Button
            variant='flat'
            color='primary'
            className='w-full'
            onPress={() => {
              if (newLeave.date && newLeave.startTime && newLeave.endTime) {
                setLeaveInputs([...leaveInputs, newLeave])
                setNewLeave({ date: '', startTime: '', endTime: '' })
              }
            }}
          >
            Add Leave Period
          </Button>

          {/* Show Added Leave Periods */}
          {leaveInputs.length > 0 && (
            <div className='mt-4'>
              <p className='text-sm font-medium mb-2'>Added Leave Periods:</p>
              <div className='space-y-2'>
                {leaveInputs.map((leave, index) => (
                  <div key={index} className='flex justify-between items-center p-2 border rounded'>
                    <div>
                      <p className='font-medium'>{leave.date}</p>
                      <p className='text-sm text-gray-500'>
                        {leave.startTime.slice(0, 5)} - {leave.endTime.slice(0, 5)}
                      </p>
                    </div>
                    <Button
                      size='sm'
                      variant='flat'
                      color='danger'
                      onPress={() => setLeaveInputs(leaves => leaves.filter((_, i) => i !== index))}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CommonModal>
    </div>
  )
}
