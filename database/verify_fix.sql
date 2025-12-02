-- Verify script for A->B rejected, B->A success

do $$
declare
  user_a uuid := 'fb8247fb-2d5f-439d-8396-3b604b1efbf2'; -- fabronjeon
  user_b uuid := '7a444bb1-f6f6-4edd-91bb-aeff94d21627'; -- tenace5329
  target_id uuid := user_a;
  current_user_id uuid := user_b;
  existing_request record;
begin
  -- 1. Cleanup
  delete from friend_requests where (sender_id = user_a and receiver_id = user_b) or (sender_id = user_b and receiver_id = user_a);
  delete from friendships where user_id in (user_a, user_b);

  -- 2. A sends to B
  insert into friend_requests (sender_id, receiver_id, sender_email, status)
  values (user_a, user_b, 'fabronjeon@gmail.com', 'pending');

  -- 3. B rejects A
  update friend_requests
  set status = 'rejected'
  where sender_id = user_a and receiver_id = user_b;

  -- 4. B sends to A (Simulating RPC logic)
  -- Logic copied from updated send_friend_request RPC
  
  -- Check for existing request
  select * into existing_request 
  from friend_requests 
  where (sender_id = current_user_id and receiver_id = target_id)
     or (sender_id = target_id and receiver_id = current_user_id);

  if existing_request is not null then
    if existing_request.status = 'rejected' then
      -- Delete the old rejected request
      delete from friend_requests where id = existing_request.id;
    end if;
  end if;

  -- Insert new request
  insert into friend_requests (sender_id, receiver_id, sender_email)
  values (current_user_id, target_id, 'tenace5329@gmail.com');

end;
$$;
