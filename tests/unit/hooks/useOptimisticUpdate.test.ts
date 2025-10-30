import { renderHook, act } from '@testing-library/react';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';
import { describe, it, expect, vi } from 'vitest';

describe('useOptimisticUpdate Hook', () => {
  it('initializes with provided data', () => {
    const initialData = { id: 1, name: 'Test' };
    const { result } = renderHook(() => useOptimisticUpdate(initialData));
    
    expect(result.current.optimisticData).toEqual(initialData);
    expect(result.current.isUpdating).toBe(false);
  });

  it('updates data optimistically', async () => {
    const initialData = { id: 1, name: 'Test' };
    const { result } = renderHook(() => useOptimisticUpdate(initialData));
    
    const newData = { id: 1, name: 'Updated' };
    const updateFn = vi.fn().mockResolvedValue(newData);

    await act(async () => {
      await result.current.update(newData, updateFn);
    });

    expect(result.current.optimisticData).toEqual(newData);
    expect(updateFn).toHaveBeenCalledWith(newData);
  });

  it('sets isUpdating flag during update', async () => {
    const initialData = { id: 1, name: 'Test' };
    const { result } = renderHook(() => useOptimisticUpdate(initialData));
    
    const updateFn = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 1, name: 'Updated' }), 100))
    );

    let isUpdatingDuringCall = false;
    
    act(() => {
      result.current.update({ id: 1, name: 'Updated' }, updateFn).then(() => {
        // After update completes
      });
      isUpdatingDuringCall = result.current.isUpdating;
    });

    expect(isUpdatingDuringCall).toBe(true);
  });

  it('reverts on update failure', async () => {
    const initialData = { id: 1, name: 'Test' };
    const { result } = renderHook(() => useOptimisticUpdate(initialData));
    
    const updateFn = vi.fn().mockRejectedValue(new Error('Update failed'));

    await act(async () => {
      try {
        await result.current.update({ id: 1, name: 'Updated' }, updateFn);
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.optimisticData).toEqual(initialData);
    expect(result.current.isUpdating).toBe(false);
  });
});
