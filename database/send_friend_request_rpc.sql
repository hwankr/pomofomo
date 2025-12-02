-- Function to send friend request handling rejections
create or replace function send_friend_request(
  receiver_email text
)
returns void
language plpgsql
security definer
as $$
declare
  target_id uuid;
  existing_request record;
begin
  -- 1. Get User ID by email
  select id into target_id from auth.users where email = receiver_email;
  
  if target_id is null then
    raise exception 'User not found with this email.';
  end if;

  if target_id = auth.uid() then
    raise exception 'You cannot add yourself.';
  end if;

  -- 2. Check for existing request
  select * into existing_request 
  from friend_requests 
  where (sender_id = auth.uid() and receiver_id = target_id)
     or (sender_id = target_id and receiver_id = auth.uid());

  if existing_request is not null then
    if existing_request.status = 'accepted' then
      raise exception 'You are already friends.';
    end if;

    if existing_request.status = 'pending' then
      raise exception 'Friend request already sent or exists.';
    end if;

    if existing_request.status = 'rejected' then
      -- If rejected, we allow resending by updating status to pending
      -- But only if the current user is the one sending it now.
      -- If the previous request was from A to B and B rejected it,
      -- and now A sends to B again, we update that row.
      -- If B sends to A, we might want to handle that too, but for now let's stick to the simple case
      -- or just update the existing row regardless of who sent it originally?
      -- Actually, if A sent to B and B rejected, the row is (sender=A, receiver=B, status=rejected).
      -- If A sends again, we update to pending.
      -- If B sends to A, we should probably create a NEW request from B to A?
      -- But the unique constraint is (sender_id, receiver_id).
      -- So B cannot send to A if there is a row (A, B).
      -- So we must update the existing row or delete it.
      -- Let's update the existing row, swapping sender/receiver if necessary?
      -- Swapping might be complex due to unique constraints if not careful.
      -- Simplest approach: Update the status to pending.
      -- And update the sender_id to the current user, and receiver_id to the target.
      -- This effectively "resets" the request.
      
      update friend_requests 
      set status = 'pending',
          created_at = now(),
          sender_id = auth.uid(),
          receiver_id = target_id,
          sender_email = (select email from auth.users where id = auth.uid()) -- ensure sender email is correct
      where id = existing_request.id;
      
      return;
    end if;
  end if;

  -- 3. Insert new request if no existing request found
  insert into friend_requests (sender_id, receiver_id, sender_email)
  values (auth.uid(), target_id, (select email from auth.users where id = auth.uid()));

end;
$$;

grant execute on function send_friend_request to authenticated;
