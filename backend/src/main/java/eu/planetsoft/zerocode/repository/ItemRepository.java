package eu.planetsoft.zerocode.repository;

import eu.planetsoft.zerocode.domain.Item;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, UUID> {
}
