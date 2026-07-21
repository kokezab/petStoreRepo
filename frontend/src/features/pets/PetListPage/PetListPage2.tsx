import { useEffect } from 'react';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { PetList } from '../components';
import { Alert, Select } from 'antd';
import axios from 'axios';

import { useAppDispatch, useAppSelector } from '@/app/AppProviders/hooks';
import type { RootState } from '@/app/AppProviders/store';

type PetStatus = 'available' | 'pending' | 'sold';

type Pet = {
  id: number;
  name: string;
  photoUrls: string[];
  status: PetStatus;
};

const statusOptions = [
  {
    value: 'available',
    label: 'available',
  },
  {
    value: 'pending',
    label: 'pending',
  },
  {
    value: 'sold',
    label: 'sold',
  },
];

type PetsState = {
  status: PetStatus;
  isLoading: boolean;
  isError: boolean;
  data: Pet[] | null;
};

const initialState: PetsState = {
  status: 'available',
  isLoading: false,
  isError: false,
  data: null,
};

export const fetchPetsByStatus = createAsyncThunk('pets/fetchByStatus', async (status: PetStatus) => {
  const response = await axios.get<Pet[]>(
    `https://petstore.swagger.io/v2/pet/findByStatus?status=${status}`,
  );
  return response.data;
});

const petsSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    statusChanged(state, action: { payload: PetStatus }) {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPetsByStatus.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchPetsByStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.data = action.payload;
      })
      .addCase(fetchPetsByStatus.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
        state.data = null;
      });
  },
});

const { statusChanged } = petsSlice.actions;
const selectPets = (state: RootState) => state.pets;

export const petsReducer = petsSlice.reducer;

export function PetListPage() {
  const dispatch = useAppDispatch();
  const { status, isLoading, isError, data } = useAppSelector(selectPets);

  useEffect(() => {
    dispatch(fetchPetsByStatus(status));
  }, [status, dispatch]);

  if (isLoading) return <p>Loading pets...</p>;
  if (isError) return <Alert type='error' title='Failed to load pets.' />;

  return (
    <div>
      <Select<PetStatus>
        value={status}
        onChange={(value) => dispatch(statusChanged(value))}
        options={statusOptions}
      />
      <PetList data={data || []} noDataMessage='No pets found' />
    </div>
  );
}
