-- Reproduction script for A->B rejected, B->A fails

do $$
declare
  user_a uuid := 'fb8247fb-2d5f-439d-8396-3b604b1efbf2'; -- fabronjeon
  user_b uuid := '7a444bb1-f6f6-4edd-91bb-aeff94d21627'; -- tenace5329
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

  -- 4. B tries to send to A (Simulating RPC call)
  -- This logic mimics the RPC 'send_friend_request'
  declare
    existing_request record;
    target_id uuid := user_a;
    current_user_id uuid := user_b;
  begin
    select * into existing_request 
    from friend_requests 
    where (sender_id = current_user_id and receiver_id = target_id)
       or (sender_id = target_id and receiver_id = current_user_id);

    if existing_request is not null then
      if existing_request.status = 'rejected' then
        -- Attempt to update
        update friend_requests 
        set status = 'pending',
            created_at = now(),
            sender_id = current_user_id,
            receiver_id = target_id,
            sender_email = 'tenace5329@gmail.com'
        where id = existing_request.id;
      end if;
    end if;
  end;
end;
$$;
