import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { useUpdateCandidateStatusMutation } from '../candidatesApi';
import MovedToEmployeesToast from '../components/MovedToEmployeesToast';
import { MOVE_TO_EMPLOYEE_STATUS } from '../constants';

const MOVED_TOAST_DURATION = 8000;

/**
 * Inline candidate status changes. Plain statuses are saved immediately (optimistically);
 * choosing the "move" status asks for confirmation first because it turns the candidate into an employee.
 * The confirmation stays open (keeping the chosen role) when the move fails, e.g. 409 duplicate email.
 *
 * @returns {{
 *   changeStatus: (candidate: object, status: string) => void,
 *   moveTarget: object|null, confirmMove: (role?: string) => Promise<void>, cancelMove: () => void,
 *   isMoving: boolean, isStatusUpdating: (id: string) => boolean,
 * }}
 */
export function useCandidateStatusChange() {
  const navigate = useNavigate();
  const [moveTarget, setMoveTarget] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [updateStatus] = useUpdateCandidateStatusMutation();

  const setPending = useCallback((id, pending) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  /** Saves the status; resolves to whether it succeeded (failures are explained in a toast). */
  const submit = useCallback(
    async (candidate, status, role) => {
      setPending(candidate._id, true);
      try {
        const result = await updateStatus({
          id: candidate._id,
          status,
          role,
        }).unwrap();
        if (result.moved) {
          const searchParams = new URLSearchParams({
            search: result.employee?.email ?? candidate.email,
          });
          toast.success(
            (current) => (
              <MovedToEmployeesToast
                name={candidate.fullName}
                onView={() => {
                  toast.dismiss(current.id);
                  navigate(`${ROUTES.employees}?${searchParams}`);
                }}
              />
            ),
            { duration: MOVED_TOAST_DURATION },
          );
        } else {
          toast.success(`${candidate.fullName} marked as ${status}`);
        }
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error));
        return false;
      } finally {
        setPending(candidate._id, false);
      }
    },
    [navigate, setPending, updateStatus],
  );

  const changeStatus = useCallback(
    (candidate, status) => {
      if (!status || status === candidate.status) return;
      if (status === MOVE_TO_EMPLOYEE_STATUS) setMoveTarget(candidate);
      else submit(candidate, status);
    },
    [submit],
  );

  const confirmMove = useCallback(
    async (role) => {
      if (!moveTarget) return;
      const moved = await submit(moveTarget, MOVE_TO_EMPLOYEE_STATUS, role);
      if (moved) setMoveTarget(null);
    },
    [moveTarget, submit],
  );

  const cancelMove = useCallback(() => setMoveTarget(null), []);
  const isStatusUpdating = useCallback((id) => pendingIds.has(id), [pendingIds]);

  return {
    changeStatus,
    moveTarget,
    confirmMove,
    cancelMove,
    isMoving: Boolean(moveTarget) && pendingIds.has(moveTarget._id),
    isStatusUpdating,
  };
}
